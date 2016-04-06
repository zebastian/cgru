#include "renderhost.h"

#ifdef WINNT
#include <fstream>
#endif

#include "../libafanasy/common/dlScopeLocker.h"

#include "../libafanasy/environment.h"
#include "../libafanasy/msg.h"

#include "pyres.h"
#include "res.h"

#define AFOUTPUT
//#undef AFOUTPUT
#include "../include/macrooutput.h"

extern bool AFRunning;

RenderHost * RenderHost::ms_obj = NULL;
af::RenderUpdate RenderHost::ms_up;
af::MsgQueue * RenderHost::ms_msgAcceptQueue = NULL;
af::MsgQueue * RenderHost::ms_msgDispatchQueue = NULL;
int RenderHost::ms_updateMsgType = af::Msg::TRenderRegister;
bool RenderHost::ms_connected = false;
int RenderHost::ms_connection_lost_count = 0;
std::vector<PyRes*> RenderHost::ms_pyres;
std::vector<TaskProcess*> RenderHost::ms_tasks;
bool RenderHost::ms_no_output_redirection = false;
std::vector<std::string> RenderHost::ms_windowsmustdie;

RenderHost::RenderHost():
	af::Render( Client::GetEnvironment)
{
    ms_obj = this;

	if( af::Environment::hasArgument("-nor")) ms_no_output_redirection = true;

    ms_msgAcceptQueue   = new af::MsgQueue("Messages Accept Queue",   af::AfQueue::e_no_thread    );
    ms_msgDispatchQueue = new af::MsgQueue("Messages Dispatch Queue", af::AfQueue::e_start_thread );
    ms_msgDispatchQueue->setReturnQueue( ms_msgAcceptQueue);
    ms_msgDispatchQueue->returnNotSended();
    ms_msgDispatchQueue->setVerboseMode( af::VerboseOff);

    setOnline();

    m_host.m_os = af::strJoin( af::Environment::getPlatform(), " ");
    GetResources( m_host, m_hres);

    std::vector<std::string> resclasses = af::Environment::getRenderResClasses();
    for( std::vector<std::string>::const_iterator it = resclasses.begin(); it != resclasses.end(); it++)
    {
        if( (*it).empty() ) continue;
        printf("Adding custom resource meter '%s'\n", (*it).c_str());
        ms_pyres.push_back( new PyRes( *it, &m_hres));
    }

#ifdef WINNT
    // Windows Must Die:
	ms_windowsmustdie = af::Environment::getRenderWindowsMustDie();
    if( ms_windowsmustdie.size())
    {
        printf("Windows Must Die:\n");
        for( int i = 0; i < ms_windowsmustdie.size(); i++)
            printf("   %s\n", ms_windowsmustdie[i].c_str());
    }
#endif

	af::sleep_msec( 100);

    GetResources( m_host, m_hres);
    for( int i = 0; i < ms_pyres.size(); i++) ms_pyres[i]->update();

    v_stdOut();
    m_host.v_stdOut( true);
    m_hres.v_stdOut( true);
}

RenderHost::~RenderHost()
{
    // Delete custom python resources:
    for( int i = 0; i < ms_pyres.size(); i++)
        if( ms_pyres[i])
            delete ms_pyres[i];

    // Send deregister message if connected:
    if( ms_connected )
    {
        af::Msg msg( af::Msg::TRenderDeregister, ms_obj->getId());
        msg.setAddress( af::Environment::getServerAddress());
        bool ok;
        af::msgsend( & msg, ok, af::VerboseOn);
        ms_connected = false;
    }

    // Delete all tasks:
    for( std::vector<TaskProcess*>::iterator it = ms_tasks.begin(); it != ms_tasks.end(); )
    {
        delete *it;
        it = ms_tasks.erase( it);
    }

    // Delete queues:
    delete ms_msgAcceptQueue;
    delete ms_msgDispatchQueue;
}

void RenderHost::dispatchMessage( af::Msg * i_msg)
{
    if( false == AFRunning ) return;

	#ifdef AFOUTPUT
	printf(" <<< "); i_msg->v_stdOut();
	#endif

    if( i_msg->addressIsEmpty() && ( i_msg->addressesCount() == 0 ))
    {
        // Assuming that message should be send to server if no address specified.
        i_msg->setAddress( af::Environment::getServerAddress());
    }
    ms_msgDispatchQueue->pushMsg( i_msg);
}

void RenderHost::setRegistered( int i_id)
{
    ms_connected = true;
    ms_obj->m_id = i_id;
    ms_msgDispatchQueue->setVerboseMode( af::VerboseOn);
    setUpdateMsgType( af::Msg::TRenderUpdate);
    printf("Render registered.\n");
	RenderHost::connectionEstablished();
}

void RenderHost::connectionLost( bool i_any_case)
{
    if( ms_connected == false )
		return;

	ms_connection_lost_count++;

	if( false == i_any_case )
	{
		printf("Connection lost count = %d of %d\n", ms_connection_lost_count, af::Environment::getRenderConnectRetries());
		if( ms_connection_lost_count <= af::Environment::getRenderConnectRetries() )
		{
			return;
		}
	}

    ms_connected = false;

    ms_obj->m_id = 0;

    // Stop all tasks:
    for( int t = 0; t < ms_tasks.size(); t++) ms_tasks[t]->stop();

    ms_msgDispatchQueue->setVerboseMode( af::VerboseOff);

    // Begin to try to register again:
    setUpdateMsgType( af::Msg::TRenderRegister);

    printf("Render connection lost, connecting...\n");
}

void RenderHost::setUpdateMsgType( int i_type)
{
    ms_updateMsgType = i_type;
}

void RenderHost::refreshTasks()
{
    if( false == AFRunning )
        return;

    // Refresh tasks:
    for( int t = 0; t < ms_tasks.size(); t++)
    {
        ms_tasks[t]->refresh();
    }

    // Remove zombies:
    for( std::vector<TaskProcess*>::iterator it = ms_tasks.begin(); it != ms_tasks.end(); )
    {
        if((*it)->isZombie())
        {
            delete *it;
            it = ms_tasks.erase( it);
        }
        else
            it++;
    }
}

void RenderHost::getResources()
{
// Do this every update time, but not the first time, as at the begininng resources are already updated
	static bool first_time = true;
	if( first_time )
	{
		first_time = false;
		return;
	}

	GetResources( ms_obj->m_host, ms_obj->m_hres);

	for( int i = 0; i < ms_pyres.size(); i++)
		ms_pyres[i]->update();

//hres.stdOut();
	#ifdef WINNT
	windowsMustDie();
	#endif
}

void RenderHost::update( const uint64_t & i_cycle)
{
	if( false == AFRunning )
		return;

	if( i_cycle % af::Environment::getRenderGetResourcesPeriod() == 0)
	{
		getResources();
		ms_up.setResources( &(ms_obj->m_hres));
	}

	if( i_cycle % af::Environment::getRenderGetServerPeriod())
		return;

	ms_up.setId( getId());

	af::Msg * msg;

	if( ms_updateMsgType == af::Msg::TRenderRegister )
	{
		msg = new af::Msg( ms_updateMsgType, ms_obj);
	}
	else
	{
		#ifdef AFOUTPUT
		ms_up.v_stdOut();
		#endif
		msg = new af::Msg( ms_updateMsgType, &ms_up);
	}

	msg->setReceiving();
	dispatchMessage( msg);

	ms_up.clear();
}

#ifdef WINNT
void RenderHost::windowsMustDie()
{
// Windows Must Die:
    AFINFO("RenderHost::windowsMustDie():");
    for( int i = 0; i < ms_windowsmustdie.size(); i++)
    {
        HWND WINAPI hw = FindWindow( NULL, TEXT( ms_windowsmustdie[i].c_str()));
        if( hw != NULL )
        {
            printf("Window must die found:\n%s\n", ms_windowsmustdie[i].c_str());
            SendMessage( hw, WM_CLOSE, 0, 0);
        }
    }
}
#endif

void RenderHost::runTask( af::Msg * i_msg)
{
    ms_tasks.push_back( new TaskProcess( new af::TaskExec( i_msg)));
}
void RenderHost::runTask( af::TaskExec * i_task)
{
	ms_tasks.push_back( new TaskProcess( i_task));
}

void RenderHost::stopTask( const af::MCTaskPos & i_taskpos)
{
    for( int t = 0; t < ms_tasks.size(); t++)
    {
        if( ms_tasks[t]->is( i_taskpos))
        {
            ms_tasks[t]->stop();
            return;
        }
    }
    AFERRAR("RenderHost::stopTask: %d tasks, no such task:", int(ms_tasks.size()))
    i_taskpos.v_stdOut();
}

void RenderHost::closeTask( const af::MCTaskPos & i_taskpos)
{
    for( int t = 0; t < ms_tasks.size(); t++)
    {
        if( ms_tasks[t]->is( i_taskpos))
        {
			ms_tasks[t]->close();
            return;
        }
    }
    AFERRAR("RenderHost::closeTask: %d tasks, no such task:", int(ms_tasks.size()))
    i_taskpos.v_stdOut();
}

void RenderHost::upTaskOutput( const af::MCTaskPos & i_taskpos)
{
	std::string str;
	for( int t = 0; t < ms_tasks.size(); t++)
	{
		if( ms_tasks[t]->is( i_taskpos))
		{
			str = ms_tasks[t]->getOutput();
			break;
		}
	}

	if( str.size() == 0 )
	{
		str = "Render has no task:";
		str += i_taskpos.v_generateInfoString();
	}

	ms_up.addTaskOutput( i_taskpos, str);
}

void RenderHost::listenTask( const af::MCTaskPos & i_tp, bool i_subscribe)
{
	for( int t = 0; t < ms_tasks.size(); t++)
	{
		if( ms_tasks[t]->is( i_tp))
		{
			ms_tasks[t]->listenOutput( i_subscribe);
			break;
		}
	}
}

void RenderHost::wolSleep( const std::string & i_str)
{
	af::Service service( af::Environment::getSysWolService(),"SLEEP", i_str);
	std::string cmd = service.getCommand();
	printf("Sleep request, executing command:\n%s\n", cmd.c_str());
	af::launchProgram( cmd);
}

