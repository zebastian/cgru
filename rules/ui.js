u_elements = ['asset','assets','info','open','log','navig','status_annotation','status_artists','status_tags','status_percentage','status_progress','status_progressbar','cycle','content_info','content_status','thumbnail','status_finish'];
u_el = {};
u_views = ['asset','files','body','comments'];

u_body_filename = 'body.html';
u_body_edit_markup = 0;
u_body_text = '';

u_elThumbnails = [];
u_thumbnails_elMakeBtns = [];
u_thumbnails_tomake = 0;

cgru_params.push(['back_asset','Asset', '', 'Enter Background Style']);
cgru_params.push(['back_body','Body', '', 'Enter Background Style']);
cgru_params.push(['back_files','Files', '', 'Enter Background Style']);
cgru_params.push(['back_comments','Comments', '', 'Enter Background Style']);

function View_body_Open() { u_BodyLoad(); }
function View_body_Close() { u_BodyEditCancel(''); }
function View_files_Open() { u_ShowDirectory( $('files'), g_elCurFolder.m_path, g_elCurFolder.m_dir); }
function View_files_Close() { $('files').textContent = ''; }

function u_Init()
{
	for( var i = 0; i < u_elements.length; i++) u_el[u_elements[i]] = document.getElementById( u_elements[i]);

	if( localStorage.header_opened == 'true' ) u_OpenCloseHeader();
	if( localStorage.footer_opened == 'true' ) u_OpenCloseFooter();

	if( p_PLAYER == true) return;

	if( localStorage.navig_width == null ) localStorage.navig_width = 300;
	if( localStorage.sidepanel_width == null ) localStorage.sidepanel_width = 200;
	if( localStorage.sidepanel_closed_width == null ) localStorage.sidepanel_closed_width = 20;
	if( localStorage.sidepanel_opened == 'true' ) u_SidePanelOpen();
	else u_SidePanelClose();

	if( localStorage.thumb_file_size == null ) localStorage.thumb_file_size = '80';
	if( localStorage.thumb_file_crop == null ) localStorage.thumb_file_crop = 'false';

	if( localStorage.show_hidden == null ) localStorage.show_hidden = 'OFF';
	$('show_hidden').textContent = localStorage.show_hidden;
	$('search_artists').m_elArtists = [];

	u_CalcGUI();

	$('body_panel_edit').m_panel_edit = u_EditPanelCreate( $('body_panel_edit'));

	for( var i = 0; i < u_views.length; i++)
		u_OpenCloseView( u_views[i], false, false);
}
function u_InitAuth()
{
	$('body_btn_0').style.display = 'block';
	$('search_artists_div').style.display = 'block';
	$('auth_user').textContent = c_GetUserTitle()+' ['+g_auth_user.id+']';
	var elArtists = $('search_artists');
	for( var user in g_users )
	{
		el = document.createElement('div');
		elArtists.appendChild( el);
		el.style.cssFloat = 'left';
		el.textContent = c_GetUserTitle( user);
		el.m_user = user;
		el.classList.add('tag');
		el.onclick = function(e){ c_ElToggleSelected(e); if( a_elThumbnails ) u_SearchSearch();};
		elArtists.m_elArtists.push( el);
	}
}

function u_Process()
{
	if( g_elCurFolder.m_dir.rufiles && ( g_elCurFolder.m_dir.rufiles.indexOf( RULES.thumbnail.filename ) != -1 ))
	{
		u_el.thumbnail.src = RULES.root+g_elCurFolder.m_path+'/'+RULES.rufolder+'/'+RULES.thumbnail.filename;
		u_el.thumbnail.style.display = 'inline';
	}
	else
	{
//		u_el.thumbnail.setAttribute('src', null );
		u_el.thumbnail.style.display = 'none';
	}

	a_Process();
	u_StatusApply();
	nw_Process();

	if( ASSET && ( ASSET.path == g_elCurFolder.m_path ))
	{
		if( localStorage.view_asset === 'true' )
			$('asset_div').style.display = 'block';
		else
			$('asset_div').style.display = 'inline';
		$('files_div').style.display = 'none';
	}
	else
	{
		$('asset_div').style.display = 'none';
		if( localStorage.view_files === 'true' )
			$('files_div').style.display = 'block';
		else
			$('files_div').style.display = 'inline';
	}

	u_ViewsFuncsOpen();

	var path = cgru_PM('/'+RULES.root+g_elCurFolder.m_path);
	c_Info( path);
	u_el.open.setAttribute('cmdexec', JSON.stringify([RULES.cmdexec.open_folder.replace(/@PATH@/g, path)]));
}

function u_Finish()
{
	st_DestroyEditUI();

	u_StatusApply( null);

	u_el.thumbnail.style.display = 'none';

	nw_Finish();
	a_Finish();

	u_ViewsFuncsClose();

	u_elThumbnails = [];
	u_thumbnails_elMakeBtns = [];
}

function u_OpenCloseHeader(){ u_OpenCloseHeaderFooter( $('headeropenbtn'),'header', -200, 0);}
function u_OpenCloseFooter(){ u_OpenCloseHeaderFooter( $('footeropenbtn'),'footer', 38, 238);}
function u_ShowHiddenToggle()
{
	if( localStorage.show_hidden == 'ON') localStorage.show_hidden = 'OFF';
	else localStorage.show_hidden = 'ON';
	$('show_hidden').textContent = localStorage.show_hidden;
}

function u_CalcGUI( i_toggle_scrollbars)
{
	var barW = u_el.navig.offsetWidth - u_el.navig.clientWidth;
	var sideW = parseInt( localStorage.sidepanel_width );
	var sideClosedW = parseInt( localStorage.sidepanel_closed_width );
	var navigW = parseInt( localStorage.navig_width );

	if( localStorage.hide_scrollbars == null ) localStorage.hide_scrollbars = 'OFF';
	if( i_toggle_scrollbars === true )
	{
		if( localStorage.hide_scrollbars == 'ON') localStorage.hide_scrollbars = 'OFF';
		else localStorage.hide_scrollbars = 'ON';
	}
	$('hide_scrollbars').textContent = localStorage.hide_scrollbars;

	if( localStorage.sidepanel_opened == 'true')
	{
		$('sidepanel_handle').style.display = 'block';
		$('sidepanel').style.left = '6px';
	}
	else
	{
		$('sidepanel_handle').style.display = 'none';
		$('sidepanel').style.left = '0px';
	}

	if( localStorage.hide_scrollbars == 'ON')
	{
		$('navig_div').style.width = (navigW - barW) +'px';
		$('navig').style.marginRight = (-barW) +'px';

		$('content').style.left = (navigW - barW) +'px';


		if( localStorage.sidepanel_opened == 'true')
		{
			$('content').style.right = (sideW - (2*barW)) + 'px';
			$('sidepanel_div').style.width = (sideW - barW) + 'px';
			$('sidepanel').style.marginRight = (-barW) +'px';
		}
		else
		{
			$('content').style.right = sideClosedW - barW + 'px';
			$('sidepanel_div').style.width = sideClosedW + 'px';
			$('sidepanel').style.marginRight = '-10px';
		}
	}
	else
	{
		$('navig_div').style.width = navigW +'px';
		$('navig').style.marginRight = '0px';

		$('content').style.left = navigW +'px';

		if( localStorage.sidepanel_opened == 'true')
		{
			$('content').style.right = sideW + 'px';
			$('sidepanel_div').style.width = sideW + 'px';
			$('sidepanel').style.marginRight = '0px';
		}
		else
		{
			$('content').style.right = sideClosedW + 'px';
			$('sidepanel_div').style.width = sideClosedW + 'px';
			$('sidepanel').style.marginRight = '-10px';
		}
	}
}

function u_ResizeGUIStart( i_name, i_koeff)
{
	u_resizing_name = i_name;
	u_resizing_koeff = i_koeff;
	u_resizing_x = null;
	document.onmousemove = u_ResizeGUI;
	document.onmouseup = u_ResizeGUIFinish;
}
function u_ResizeGUI( i_e)
{
	if( u_resizing_name == null ) u_ResizeGUIFinish();
	if( u_resizing_x == null ) u_resizing_x = i_e.screenX;

	var size = parseInt( localStorage[u_resizing_name]);
	var delta = i_e.screenX - u_resizing_x;
	var size = size + delta*u_resizing_koeff;
	if( size < 50 ) return;
	if( size > 500 ) return;
	u_resizing_x = i_e.screenX;
//console.log( size+'+'+i_e.screenX+'-'+u_resizing_x+'='+size);
	localStorage[u_resizing_name] = '' + size;
	u_CalcGUI();
}
function u_ResizeGUIFinish()
{
	u_resizing_name = null;
	document.onmousemove = null;
	document.onmouseup = null;
}

function u_ApplyStyles()
{
	if( p_PLAYER ) return;
	document.body.style.background = localStorage.background;
	document.body.style.color = localStorage.text_color;
	var backs = ['header','footer','navig_div','sidepanel_div','content','navig_handle'];
	for( var i = 0; i < backs.length; i++ )
		$(backs[i]).style.background = localStorage.background;
	var backs = ['asset','body','files','comments'];
	for( var i = 0; i < backs.length; i++ )
		$(backs[i]+'_div').style.background = localStorage['back_' + backs[i]];
}

function u_StatusApply( i_status)
{
	if( i_status != null )
		RULES.status = c_CloneObj( i_status);
	else
		i_status = RULES.status;

	st_SetElAnnotation( i_status, u_el.status_annotation);
	st_SetElColor( i_status, u_el.content_info);
	st_SetElProgress( i_status, u_el.status_progressbar, u_el.status_progress, u_el.status_percentage);
	st_SetElArtists( i_status, u_el.status_artists);
	st_SetElTags( i_status, u_el.status_tags);
	st_SetElFinish( i_status, u_el.status_finish);
	var modified = '';
	if( RULES.status )
	{
		if( RULES.status.muser ) modified += ' by ' + c_GetUserTitle( RULES.status.muser);
		if( RULES.status.mtime ) modified += ' at ' + c_DT_StrFromSec( RULES.status.mtime);
		if( modified != '' ) modified = 'Modified' + modified;
	}
	$('status_modified').innerHTML = modified;
}

function u_StatusEditOnClick()
{
	st_CreateEditUI( u_el.content_info, g_CurPath(), RULES.status, u_StatusApply, u_el.content_status);
}

function u_OpenCloseHeaderFooter( i_elBtn, i_id, i_closed, i_opened)
{
	if( i_elBtn.classList.contains('opened'))
	{
		i_elBtn.classList.remove('opened');
		if( i_id == 'header')
		{
			localStorage.header_opened = 'false';
			i_elBtn.innerHTML = '&darr;';
			document.getElementById( i_id).style.top = i_closed+'px';
		}
		else
		{
			localStorage.footer_opened = 'false';
			i_elBtn.innerHTML = '&uarr;';
			document.getElementById('footer').style.height = i_closed+'px';
			document.getElementById('log').style.display= 'none';
		}
	}
	else
	{
		i_elBtn.classList.add('opened');
		if( i_id == 'header')
		{
			localStorage.header_opened = 'true';
			i_elBtn.innerHTML = '&uarr;';
			document.getElementById( i_id).style.top = i_opened+'px';
		}
		else
		{
			localStorage.footer_opened = 'true';
			i_elBtn.innerHTML = '&darr;';
			document.getElementById('footer').style.height = i_opened+'px';
			document.getElementById('log').style.display= 'block';
		}
	}
}

function u_SidePanelHideOnClick() { u_SidePanelClose()}
function u_SidePanelClose()
{
	localStorage.sidepanel_opened = 'false';
	$('sidepanel').classList.remove('opened');
	u_CalcGUI();
}
function u_SidePanelOpen()
{
	localStorage.sidepanel_opened = 'true';
	$('sidepanel').classList.add('opened');
	u_CalcGUI();
}

function u_RulesShow() { cgru_ShowObject( RULES, 'RULES '+g_CurPath()); }

function u_DrawColorBars( i_el, i_onclick, i_height)
{
	if( i_height == null )
		i_height = '20px';
	else
		i_height = Math.round( i_height/3 )+'px';
	i_el.classList.add('colorbars');
	var ccol = 35;
	var crow = 3;
	var cstep = 5;
	var cnum = crow * ccol;
	for( var cr = 0; cr < crow; cr++)
	{
		elRaw = document.createElement('div');
		i_el.appendChild( elRaw);
		for( var cc = 0; cc < ccol; cc++)
		{
			el = document.createElement('div');
			elRaw.appendChild( el);
			el.style.width = 100/ccol + '%';
			el.style.height = i_height;
			el.onclick = i_onclick;

			var r = 0, g = 0, b = 0;
			r = ( ( cc % cstep ) + 1 ) / ( cstep + 1 );

			if     (cc < cstep  ) { r = cc/(cstep-1); g = r; b = r; }
			else if(cc < cstep*2) { r = r; }
			else if(cc < cstep*3) { g = r; r = 0; }
			else if(cc < cstep*4) { b = r; r = 0; }
			else if(cc < cstep*5) { g = r; }
			else if(cc < cstep*6) { b = r; }
			else if(cc < cstep*7) { g = r; b = r; r = 0; }

			if( cr > 0 )
			{
				var avg = (r+g+b)/2.5;
				var sat = 2, add = .1;
				if( cr > 1 ) { sat = 1.2; add = .2};
				r += add+(avg-r)/sat;
				g += add+(avg-g)/sat;
				b += add+(avg-b)/sat;
			}

			r = Math.round( 255*r);
			g = Math.round( 255*g);
			b = Math.round( 255*b);
			if( r > 255 ) r = 255;
			if( g > 255 ) g = 255;
			if( b > 255 ) b = 255;

			if( cr && (cc < cstep))
				el.m_color = null;
			else
			{
				el.style.background = 'rgb('+r+','+g+','+b+')';
				el.m_color = [r,g,b];
			}
//window.console.log('rgb('+r+','+g+','+b+')');
		}
	}
}

function u_ShowDirectory( i_element, i_path, i_walk)
{
	i_element.classList.add('show_folder');

	var elPanel = document.createElement('div');
	i_element.appendChild( elPanel);
	elPanel.classList.add('panel');

	var elTitle = document.createElement('div');
	elPanel.appendChild( elTitle);
	elTitle.classList.add('title');
	var title = '';
	if( ASSET && ASSET.name )
		title = ASSET.name;
	elTitle.textContent = title;

	var elPath = document.createElement('div');
	elPanel.appendChild( elPath);
	var path = i_path;
	if( ASSET && ASSET.path )
		path = path.replace( ASSET.path, '');
	elPath.classList.add('path');
	elPath.textContent = path;

	c_CreateOpenButton( elPath, i_path);

	var elThumbDiv = document.createElement('div');
	elPanel.appendChild( elThumbDiv);
	elThumbDiv.classList.add('thumbsdiv');
	
	var elThumbBigger = document.createElement('div');
	elThumbDiv.appendChild( elThumbBigger);
	elThumbBigger.classList.add('button');
	elThumbBigger.textContent = '+';
	elThumbBigger.onclick = u_FileThumbsBigger;

	var elThumbSmaller = document.createElement('div');
	elThumbDiv.appendChild( elThumbSmaller);
	elThumbSmaller.classList.add('button');
	elThumbSmaller.textContent = '-';
	elThumbSmaller.onclick = u_FileThumbsSmaller;

	var elThumbCrop = document.createElement('div');
	elThumbDiv.appendChild( elThumbCrop);
	elThumbCrop.classList.add('button');
	elThumbCrop.textContent = '[c]';
	elThumbCrop.onclick = u_FileThumbsCrop;

	var elMakeThumbnails = document.createElement('div');
	elThumbDiv.appendChild( elMakeThumbnails);
	elMakeThumbnails.classList.add('button');
	elMakeThumbnails.textContent = 'Thumbs:';
	elMakeThumbnails.onclick = u_MakeThumbnails;
	u_thumbnails_elMakeBtns.push( elMakeThumbnails);

	elFiles = [];
	if( i_walk.folders)
	{
		i_walk.folders.sort( c_CompareFiles );
		for( var i = 0; i < i_walk.folders.length; i++)
			if( false == u_SkipFile( i_walk.folders[i].name))
				elFiles.push( u_ShowFolder( i_element, i_path + '/' + i_walk.folders[i].name, i_walk));
	}

	if( i_walk.files)
	{
		i_walk.files.sort( c_CompareFiles );
		for( var i = 0; i < i_walk.files.length; i++)
			if( false == u_SkipFile( i_walk.files[i].name))
				elFiles.push( u_ShowFile( i_element, i_path, i_walk.files[i], i_walk));
	}

	elMakeThumbnails.m_elFiles = elFiles;
	return elFiles;
}

function u_ShowFolder( i_element, i_path, i_walk)
{
	i_path = i_path.replace( /\/\//g, '/');
	var name = i_path.split('/');
	name = name[name.length-1];

	var elFolder = document.createElement('div');
	elFolder.classList.add('folder');
	i_element.appendChild( elFolder);

	u_MakeFileThumbEl( elFolder, i_path, name, i_walk, 'folder');

	var elOpen = c_CreateOpenButton( elFolder, i_path);
	elOpen.style.cssFloat = 'left';

	var elLinkA = document.createElement('a');
	elFolder.appendChild( elLinkA);
	elLinkA.setAttribute('href', '#'+i_path);
	elLinkA.textContent = name;

	var elLinkA = document.createElement('a');
	elFolder.appendChild( elLinkA);
	elLinkA.setAttribute('href', 'player.html#'+i_path);
	elLinkA.setAttribute('target', '_blank');
	elLinkA.textContent = 'play';
	elLinkA.style.cssFloat = 'right';

	var cmds = RULES.cmdexec.play_sequence;
	if( cmds ) for( var c = 0; c < cmds.length; c++)
	{
		var elCmd = document.createElement('div');
		elFolder.appendChild( elCmd);
		elCmd.classList.add('cmdexec');
		elCmd.textContent = cmds[c].name;
		var cmd = cmds[c].cmd;
		cmd = cmd.replace('@PATH@', cgru_PM('/'+RULES.root + i_path));
		cmd = cmd.replace('@FPS@', RULES.fps);
		elCmd.setAttribute('cmdexec', JSON.stringify([cmd]));
	}

	if( ASSET && ( ASSET.dailies ))
	{
		var elMakeDailies = document.createElement('div');
		elFolder.appendChild( elMakeDailies);
		elMakeDailies.classList.add('button');
		elMakeDailies.textContent = 'Dailies';
		elMakeDailies.m_path = i_path;
		elMakeDailies.onclick = function(e){
			d_Make( e.currentTarget.m_path, ASSET.path+'/'+ASSET.dailies.path[0])};
	}

	return elFolder;
}

function u_ShowFile( i_element, i_path, i_file, i_walk)
{
	var path = i_path + '/' + i_file.name;

	var elFile = document.createElement('div');
	i_element.appendChild( elFile);
	elFile.classList.add('folder');
	elFile.classList.add('file');

	u_MakeFileThumbEl( elFile, path, i_file.name, i_walk, 'file');

	var elLinkA = document.createElement('a');
	elFile.appendChild( elLinkA);
	elLinkA.href = RULES.root + path;
	elLinkA.target = '_blank';
	elLinkA.textContent = i_file.name;

	if( c_FileIsMov( i_file.name))
	{
		var cmds = RULES.cmdexec.play_movie;
		if( cmds ) for( var c = 0; c < cmds.length; c++)
		{
			var elCmd = document.createElement('div');
			elFile.appendChild( elCmd);
			elCmd.classList.add('cmdexec');
			elCmd.textContent = cmds[c].name;
			var cmd = cmds[c].cmd;
			cmd = cmd.replace('@PATH@', cgru_PM('/'+RULES.root + path));
			cmd = cmd.replace('@FPS@', RULES.fps);
			elCmd.setAttribute('cmdexec', JSON.stringify([cmd]));
		}

		var elExplode = document.createElement('div');
		elFile.appendChild( elExplode);
		elExplode.classList.add('button');
		elExplode.textContent = 'Explode';
		elExplode.m_path = path;
		elExplode.onclick = function(e){ d_Explode( e.currentTarget.m_path)};
	}

	var elSize = document.createElement('div');
	elFile.appendChild( elSize);
	elSize.classList.add('size');
	elSize.textContent = c_Bytes2KMG( i_file.size);

	return elFile;
}

function u_MakeFileThumbEl( i_el, i_path, i_name, i_walk, i_type)
{
//	var elThumbnal = document.createElement('img');
	var elThumbnal = document.createElement('div');
	i_el.appendChild( elThumbnal);
	i_el.m_elThumbnail = elThumbnal;
	elThumbnal.classList.add('thumbnail');
	elThumbnal.m_type = i_type;

	var thumbName = 'thumbnail.' + i_name + '.jpg';
	var thumbFile = RULES.root + i_path.substr( 0, i_path.lastIndexOf('/'));
	thumbFile += '/' + RULES.rufolder + '/' + thumbName;
	elThumbnal.m_path = i_path;
	elThumbnal.m_thumbFile = thumbFile;
	u_elThumbnails.push( elThumbnal);

	var elImg = document.createElement('img');
	elThumbnal.appendChild( elImg);
	elThumbnal.m_elImg = elImg;
	if( i_walk && i_walk.rufiles && ( i_walk.rufiles.indexOf( thumbName) != -1))
		elImg.src = thumbFile;
	else
		elThumbnal.style.display = 'none';

	u_FileThumbResize( elImg);
	elImg.onload = u_FileThumbOnLoad;
}

function u_FileThumbsBigger( i_smaller)
{
	var s = parseInt( localStorage.thumb_file_size );
	var ns = s;
	if( i_smaller === true ) ns -= 10;
	else ns += 10;

	if( ns < 10 ) return;
	if( ns > 160 ) return;

	localStorage.thumb_file_size = ''+ns;
	u_FileThumbResizeAll();
}
function u_FileThumbsSmaller() { u_FileThumbsBigger( true); }

function u_FileThumbsCrop()
{
	if( localStorage.thumb_file_crop === 'true' )
		localStorage.thumb_file_crop = 'false';
	else
		localStorage.thumb_file_crop = 'true';
	u_FileThumbResizeAll();
}

function u_FileThumbResizeAll() { for( var i = 0; i < u_elThumbnails.length; i++) u_FileThumbResize( u_elThumbnails[i].m_elImg); }

function u_FileThumbOnLoad() { u_FileThumbResize( this);}
function u_FileThumbResize( i_img)
{
	var iw = i_img.naturalWidth;
	var ih = i_img.naturalHeight;

	var loaded = (( ih > 0 ) && ( iw > 0 ));
	var crop = ( localStorage.thumb_file_crop === 'true' );
	var w = parseInt( localStorage.thumb_file_size);
	var h = Math.round( w * 9 / 16);

	if( c_FileIsMov( i_img.parentNode.m_path ) || ( i_img.parentNode.m_type == 'folder')) w *= 3;

	if( false == crop )
	{
//		i_img.width = w;
		i_img.height = h;
		i_img.width = iw * h / ih;
		i_img.style.marginTop = '0';
		i_img.style.marginLeft = '0';
		i_img.parentNode.style.width = 'auto';
		i_img.parentNode.style.height = 'auto';
		return;
	}

	if( false == loaded ) return;

	if(( iw / ih) < (w / h))
	{
		ih = ih*w/iw;
		iw = w;
	}
	else
	{
		iw = iw*h/ih;
		ih = h;
	}

	i_img.width = Math.round(iw);
	i_img.height = Math.round(ih);

	var mw = Math.round((w-iw)/2);
	var mh = Math.round((h-ih)/2);

	i_img.style.marginTop = mh+'px';
	i_img.style.marginLeft = mw+'px';

	i_img.parentNode.style.width = w+'px';
	i_img.parentNode.style.height = h+'px';
}


function u_SkipFile( i_filename)
{
	if( i_filename.indexOf('/') != -1 )
		i_filename = i_filename.substr( i_filename.lastIndexOf('/')+1);
	for( var i = 0; i < RULES.skipfiles.length; i++ )
		if( i_filename.indexOf( RULES.skipfiles[i]) == 0 )
			return true;
	return false;
}

function u_SearchOnClick()
{
	$('search_result').textContent = '';
	$('search_result_div').style.display = 'none';

	if( $('search_btn').m_opened )
	{
		$('search_btn').m_opened = false;
		$('search_btn').textContent = 'Search';
		$('search').style.display = 'none';
		g_ClearLocationArgs();
		a_ShowAllThumbnails();
		$('search').m_path = null;
	}
	else
	{
		$('search_btn').m_opened = true;
		$('search_btn').textContent = 'Close Search';
		$('search').style.display = 'block';

		if( $('search_tags').m_elTags )
			for( var i = 0; i < $('search_tags').m_elTags.length; i++ )
				$('search_tags').removeChild( $('search_tags').m_elTags[i]);
		$('search_tags').m_elTags = [];
		for( var tag in RULES.tags )
		{
			el = document.createElement('div');
			$('search_tags').appendChild( el);
			el.style.cssFloat = 'left';
			st_SetElTag( el, tag);
			el.m_tag = tag;
			el.classList.add('tag');
			el.onclick = function(e){ c_ElToggleSelected(e); if( a_elThumbnails ) u_SearchSearch();};
			$('search_tags').m_elTags.push( el);
		}

		if( ASSET && ( ASSET.thumbnails != null))
			$('search_comment_div').style.display = 'none';
		else
			$('search_comment_div').style.display = 'block';
	}
}

function u_SearchSearch()
{
//console.log('g_CurPath(): ' + g_CurPath());
//console.log('search path: ' + $('search').m_path);
	if( $('search').m_path && ( $('search').m_path != g_CurPath() ))
	{
console.log('g_GO: ' + $('search').m_path);
		g_GO($('search').m_path);
		g_PathChanged();
	}
	$('search').m_path = g_CurPath();
//console.log(g_CurPath());

	var args = {};
	if( c_Strip($('search_annotation').textContent).length )
		args.ann = c_Strip($('search_annotation').textContent);

	for( var i = 0; i < $('search_artists').m_elArtists.length; i++)
		if( $('search_artists').m_elArtists[i].m_selected )
		{
			if( args.artists == null ) args.artists = [];
			args.artists.push( $('search_artists').m_elArtists[i].m_user);
		}
	for( var i = 0; i < $('search_tags').m_elTags.length; i++)
		if( $('search_tags').m_elTags[i].m_selected )
		{
			if( args.tags == null ) args.tags = [];
			args.tags.push( $('search_tags').m_elTags[i].m_tag);
		}

	var parm = ['percent','finish','statmod','bodymod'];
	for( var i = 0; i < parm.length; i++ )
	{
		var min = c_GetElInteger( $('search_'+parm[i]+'min'));
		var max = c_GetElInteger( $('search_'+parm[i]+'max'));
		if(( min != null ) || ( max != null ))
			args[parm[i]] = [min,max];
	}

	if( c_Strip($('search_body').textContent).length )
		args.body = c_Strip($('search_body').textContent);
	if( c_Strip($('search_comment').textContent).length )
		args.comment = c_Strip($('search_comment').textContent);

	g_SetLocationArgs({"u_Search":args});
}

function u_Search( i_args)
{
	$('search_result').textContent = '';
	$('search_result_div').style.display = 'none';

	if( $('search_btn').m_opened !== true ) u_SearchOnClick();

	if( i_args == null ) i_args = {};

	var anns = null;
	if( i_args.ann )
		$('search_annotation').textContent = i_args.ann;
	if( i_args.artists )
		for( i = 0; i < $('search_artists').m_elArtists.length; i++ )
			c_ElSetSelected( $('search_artists').m_elArtists[i], i_args.artists.indexOf( $('search_artists').m_elArtists[i].m_user ) != -1 )
	if( i_args.tags ) 
		for( i = 0; i < $('search_tags').m_elTags.length; i++ )
			c_ElSetSelected( $('search_tags').m_elTags[i], i_args.tags.indexOf( $('search_tags').m_elTags[i].m_tag ) != -1 )

	var parm = ['percent','finish','statmod','bodymod'];
	for( var i = 0; i < parm.length; i++ )
		if( i_args[parm[i]] )
		{
			if(( i_args[parm[i]][0] != null ) && ( i_args[parm[i]][1] != null ) && ( i_args[parm[i]][0] > i_args[parm[i]][1] ))
			{
				i_args[parm[i]][0]+= i_args[parm[i]][1];
				i_args[parm[i]][1] = i_args[parm[i]][0] - i_args[parm[i]][1];
				i_args[parm[i]][0] = i_args[parm[i]][0] - i_args[parm[i]][1];
			}
			$('search_'+parm[i]+'min').textContent = i_args[parm[i]][0];
			$('search_'+parm[i]+'max').textContent = i_args[parm[i]][1];
		}

	if( i_args.body )
		$('search_body').textContent = i_args.body;
	if( i_args.comment )
		$('search_comment').textContent = i_args.comment;

	if( a_elThumbnails )
	{
		a_ThumbFilter( i_args);
		return;
	}

	$('search_path').textContent = g_CurPath();
	$('search_path').href = '#'+g_CurPath();

	var args = {};
	for( arg in i_args )
	{
		if( arg == 'comment' ) { args.comment = i_args['comment']; continue; }
		if( arg == 'body' ) { args.body = i_args['body']; continue; }
		if( args.status == null ) args.status = {};
		args.status[arg] = i_args[arg];
	}
	args.path = RULES.root + g_CurPath();
	args.rufolder = RULES.rufolder;
	args.depth = 4;

	var res = c_Parse( n_Request({"search":args}));

	if( res.error )
	{
		c_Error( res.error);
		return;
	}

	if( res.result == null )
	{
		c_Error('Search returned null result.');
		return;
	}

	$('search_result_div').style.display = 'block';
	res.result.sort();
	for( var i = 0; i < res.result.length; i++)
	{
		var path = res.result[i];
		path = path.replace( RULES.root, '');
		path = path.replace( /\/\//g, '/');
		var el = document.createElement('div');
		$('search_result').appendChild( el);
		var elLink = document.createElement('a');
		el.appendChild( elLink);
		elLink.href = '#'+path;
//		elLink.target = '_blank';
		elLink.textContent = path;
	}
}

function u_BodyLoad( i_nockeck)
{
	if( u_body_edit_markup ) u_BodyEditMarkup();
	u_body_text = n_GetRuFile( u_body_filename, i_nockeck);
	$('body_body').innerHTML = u_body_text;
	var info = '';
	if( RULES.status && RULES.status.body )
	{
		info += 'Created by '+c_GetUserTitle( RULES.status.body.cuser);
		info += ' at '+c_DT_StrFromSec( RULES.status.body.ctime);
		if( RULES.status.body.muser )
		{
			info += '<br>Modified by '+c_GetUserTitle( RULES.status.body.muser);
			info += ' at '+c_DT_StrFromSec( RULES.status.body.mtime);
		}
	}
	$('body_info').innerHTML = info;
}

function u_BodyEditStart()
{
	if( g_auth_user == null ) return;
	if( $('body_body').classList.contains('editing'))
	{
		u_BodyEditCancel();
		return;
	}

	$('body_btn_0').textContent = 'Cancel';
	$('body_panel').style.display = 'none';
	$('body_panel_edit').style.display = 'block';
	$('body_body').contentEditable = 'true';
	$('body_body').classList.add('editing');
	$('body_body').focus();
}

function u_BodyEditCancel( i_text)
{
	if( u_body_edit_markup ) u_BodyEditMarkup();
	if( i_text == null ) i_text = u_body_text;
	$('body_body').innerHTML = i_text;

	$('body_btn_0').textContent = 'Edit';
	$('body_panel').style.display = 'block';
	$('body_panel_edit').style.display = 'none';
	$('body_body').classList.remove('editing');
	$('body_body').contentEditable = 'false';
}

function u_BodyEditSave()
{
	if( g_auth_user == null ) return;

	if( u_body_edit_markup ) u_BodyEditMarkup();
	var res = c_Parse( n_Request({"save":{"file":c_GetRuFilePath( u_body_filename),"data":$('body_body').innerHTML}}));

	if( RULES.status == null ) RULES.status = {};
	if( RULES.status.body == null )
	{
		RULES.status.body = {};
		RULES.status.body.cuser = g_auth_user.id;
		RULES.status.body.ctime = c_DT_CurSeconds();
	}
	else
	{
		RULES.status.body.muser = g_auth_user.id;
		RULES.status.body.mtime = c_DT_CurSeconds();
	}

	st_Save();
	nw_MakeNews('<i>body</i>');
	u_BodyEditCancel();
	u_BodyLoad( true);
}

function u_BodyEditMarkup()
{
	u_body_edit_markup = 1 - u_body_edit_markup;
	if( u_body_edit_markup )
	{
		$('body_body').textContent = $('body_body').innerHTML;
		$('body_edit_markup').classList.add('selected');
		$('body_panel_edit').m_panel_edit.style.display = 'none';
	}
	else
	{
		$('body_body').innerHTML = $('body_body').textContent;
		$('body_edit_markup').classList.remove('selected');
		$('body_panel_edit').m_panel_edit.style.display = 'block';
	}
}

function u_OpenCloseViewsAll()
{
	for( var i = 0; i < u_views.length; i++)
		au_OpenCloseView( u_views[i], false, false);
}
function u_ViewsFuncsOpen()
{
	for( var i = 0; i < u_views.length; i++)
		if( localStorage['view_'+u_views[i]] === 'true' )
			if( window['View_'+u_views[i]+'_Open'] ) window['View_'+u_views[i]+'_Open']();
}
function u_ViewsFuncsClose()
{
	for( var i = 0; i < u_views.length; i++)
		if( localStorage['view_'+u_views[i]] === 'true' )
			if( window['View_'+u_views[i]+'_Close'] ) window['View_'+u_views[i]+'_Close']();
}
function u_OpenCloseView( i_id, i_toggle, i_callfuncs)
{
//console.log(i_id+': '+localStorage['view_'+i_id]);
	if( localStorage['view_'+i_id] == null ) localStorage['view_'+i_id] = 'true';
	if( i_toggle !== false )
	{
		if( localStorage['view_'+i_id] !== 'true' )
			localStorage['view_'+i_id] = 'true';
		else
			localStorage['view_'+i_id] = 'false';
	}

	if( localStorage['view_'+i_id] === 'true' )
	{
		$(i_id).style.display = 'block';
		$(i_id+'_label').style.display = 'block';
		$(i_id+'_div').style.display = 'block';
		$(i_id+'_div').style.clear = 'both';
		$(i_id+'_btn').innerHTML = '-';
		$(i_id+'_btn').classList.add('opened');
		$(i_id+'_btn').classList.remove('closed');
		for( var i = 0; i < 10; i++ ) if($(i_id+'_btn_'+i)) $(i_id+'_btn_'+i).style.display = 'block';
		if( i_callfuncs !== false )
			if( window['View_'+i_id+'_Open'] ) window['View_'+i_id+'_Open']();
	}
	else
	{
		$(i_id).style.display = 'none';
		$(i_id+'_label').style.display = 'none';
		$(i_id+'_div').style.display = 'inline';
		$(i_id+'_div').style.clear = 'none';
		$(i_id+'_btn').innerHTML = $(i_id+'_label').innerHTML;
		$(i_id+'_btn').classList.remove('opened');
		$(i_id+'_btn').classList.add('closed');
		for( var i = 0; i < 10; i++ ) if($(i_id+'_btn_'+i)) $(i_id+'_btn_'+i).style.display = 'none';
		if( i_callfuncs !== false )
			if( window['View_'+i_id+'_Close'] ) window['View_'+i_id+'_Close']();
	}
}

function u_UpdateThumbnail( i_msg)
{
	if( i_msg.thumbnail == null ) return;

	u_MakeThumbnail();

	if( i_msg.error )
	{
		c_Error('Make thumbnail: '+i_msg.error);
		return;
	}

	if( i_msg.status == 'skipped' ) return;

	i_msg.thumbnail = cgru_PM( i_msg.thumbnail, false);
	var path = i_msg.thumbnail.replace( RULES.root, '');
	var path = path.replace( /\/\//g, '/');
	if( path == (g_CurPath() + '/' + RULES.rufolder + '/' + RULES.thumbnail.filename))
	{
		u_el.thumbnail.src = i_msg.thumbnail;
		u_el.thumbnail.style.display = 'inline';
		return;
	}

	for( var i = 0; i < u_elThumbnails.length; i++)
	{
		if( u_elThumbnails[i].m_thumbFile == i_msg.thumbnail )
		{
			u_elThumbnails[i].m_elImg.src = i_msg.thumbnail;
			u_elThumbnails[i].style.display = 'block';
			break;
		}
	}
}

function u_MakeThumbnails( i_evt)
{
	if( u_thumbnails_tomake > 0 ) return;

	var elFiles = i_evt.currentTarget.m_elFiles;
	u_thumbnails_tomake = elFiles.length;
	if( u_thumbnails_tomake == 0 ) return;

	for( var i = 0; i < u_thumbnails_elMakeBtns.length; i++)
		u_thumbnails_elMakeBtns[i].classList.remove('button');

	u_thumbnails_tomake_files = [];
	u_thumbnails_tomake_thumbs = [];
	for( var i = 0; i < elFiles.length; i++)
	{
//console.log( elFiles[i].m_elThumbnail.m_path );
//console.log( elFiles[i].m_elThumbnail.m_thumbFile );
		u_thumbnails_tomake_files.push( elFiles[i].m_elThumbnail.m_path);
		u_thumbnails_tomake_thumbs.push( elFiles[i].m_elThumbnail.m_thumbFile);
	}

	u_MakeThumbnail();
}

function u_MakeThumbnail()
{
	if( u_thumbnails_tomake == 0 )
	{
		u_MakeThumbnailsFinish();
		return;
	}

	var input = RULES.root + u_thumbnails_tomake_files.shift();
	var output = u_thumbnails_tomake_thumbs.shift();
	u_thumbnails_tomake--;

//	var output = cgru_PM('/' + RULES.root + i_path + '/'+RULES.rufolder+'/' + RULES.thumbnail.filename, true);
	var cmd = RULES.thumbnail.create_file;
	cmd = cmd.replace(/@INPUT@/g, input).replace(/@OUTPUT@/g, output);

	n_Request({"cmdexec":{"cmds":[cmd]}}, false);
}

function u_MakeThumbnailsFinish()
{
	for( var i = 0; i < u_thumbnails_elMakeBtns.length; i++)
		u_thumbnails_elMakeBtns[i].classList.add('button');
	u_thumbnails_tomake = 0;
}

function u_EditPanelCreate( i_el)
{
	var elPanel = document.createElement('div');
	i_el.appendChild( elPanel);
	elPanel.classList.add('textedit_panel');

	var cmds = [];
	cmds.push(['Tx','removeFormat', null,'Remove Formatting']);
	cmds.push(['<b>B</b>','bold', null,'Bold']);
	cmds.push(['<i>I</i>','italic', null,'Italic']);
//	cmds.push(['>','indent', null]);
//	cmds.push(['<','outdent', null]);
//	cmds.push(['1','insertOrderedList', '']);
//	cmds.push(['*','insertUnorderedList', null]);
	cmds.push(['&uarr;','superscript', null,'Super']);
	cmds.push(['&darr;','subscript', null,'Sub']);
	cmds.push(['s','decreaseFontSize', null,'Smaller']);
	cmds.push(['S','increaseFontSize', null,'Bigger']);
//	cmds.push(['k','formatBlock', 'kbd']);
//	cmds.push(['c','formatBlock', 'code']);
	cmds.push(['F','formatBlock', 'pre','Pre Formatted']);
	cmds.push(['p','formatBlock', 'p','Paragraph']);
	cmds.push(['C','foreColor', '#990000','Text Color']);
	cmds.push(['C','foreColor', '#666600','Text Color']);
	cmds.push(['C','foreColor', '#008800','Text Color']);
	cmds.push(['C','foreColor', '#007777','Text Color']);
	cmds.push(['C','foreColor', '#000099','Text Color']);
	cmds.push(['C','foreColor', '#880088','Text Color']);
	cmds.push(['C','foreColor', '#FFFFFF','Text Color']);
	cmds.push(['C','foreColor', '#000000','Text Color']);
	cmds.push(['B','backColor', '#DD4444','Back Color']);
	cmds.push(['B','backColor', '#DDDD44','Back Color']);
	cmds.push(['B','backColor', '#66DD66','Back Color']);
	cmds.push(['B','backColor', '#66DDDD','Back Color']);
	cmds.push(['B','backColor', '#6666FF','Back Color']);
	cmds.push(['B','backColor', '#DD66DD','Back Color']);
	cmds.push(['B','backColor', '#FFFFFF','Back Color']);
	cmds.push(['B','backColor', '#000000','Back Color']);
//	cmds.push(['Q','formatBlock', 'DL']);

	for( var i = 1; i < 4; i++ )
		cmds.push([('h'+i),'heading',('h'+i),'Header '+i]);

	for( var i = 0; i < cmds.length; i++ )
	{
		var el = document.createElement('div');
		elPanel.appendChild( el);
		el.classList.add('button');
		el.innerHTML = cmds[i][0];
		el.title = cmds[i][3];
		el.m_cmd = cmds[i];
//		el.style.cssFloat = 'left';
		if(( el.m_cmd[1] == 'foreColor') && ( el.m_cmd[1] != null )) el.style.color = el.m_cmd[2];
		if(( el.m_cmd[1] == 'backColor') && ( el.m_cmd[1] != null )) el.style.background = el.m_cmd[2];
		el.onclick = function(e){
			var el = e.currentTarget;
			document.execCommand( el.m_cmd[1], false, el.m_cmd[2]);
		}
	}

	return elPanel;
}
