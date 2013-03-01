/** Variables para Javascript **/
var paginaActual;
var paginaIndex = "index.html";
var paginaPrincipal = "default.html";
var paginaSinConexion = "sinConexion.html";
var templateDashboard = "dashboard.html";

//var URL = "192.168.1.225:3000";
var URL = "still-eyrie-7957.herokuapp.com";

var appId = "336541486458847";
// var sistemaOperativo = "iOS"; //iOS
var sistemaOperativo = "Android"; //Android
var agente = navigator.userAgent;

var TIPO_CARTA_FAMOSO = 1;
var TIPO_CARTA_PERSONAJE = 2;
var TIPO_CARTA_AMIGO = 3;

var ESTATUS_NUEVO = 'NUEVO';
var ESTATUS_TURNO = 'TURNO';
var ESTATUS_TU_TURNO = 'TU_TURNO';
var ESTATUS_SU_TURNO = 'SU_TURNO';
var ESTATUS_ABANDONO = 'ABANDONO';
var ESTATUS_FINALIZO = 'FINALIZO';

gApp = new Array();

gApp.deviceready = false;
gApp.gcmregid = '';
gApp.appId = "413879514049";

function
GCM_Event(e)
{
  // console.log("EVENTO: " + e.event);
  switch( e.event )
  {
  case 'registered':
    gApp.gcmregid = e.regid;
    break;
    
  case 'messageReceived':
  	if (paginaActual == templateDashboard) {
    	inicio();
    }
    break;

  case 'error':
    break;

  default:
    break;
  }
}

function
GCM_Success(e)
{
  //SUCCESS
}

function
GCM_Fail(e)
{
 // FAIL
}

/** Inicializa listeners para eventos **/
document.addEventListener("offline", redirigirSinConexion, false);
document.addEventListener("deviceready", registerNotifications, false);

function registerNotifications() {
	document.addEventListener("backbutton", back, false);
	
	gApp.DeviceReady = true;
	window.plugins.GCM.register(gApp.appId, "GCM_Event", GCM_Success, GCM_Fail );
    init();
}

function back() {
	cerrarAlert();
	if (paginaActual == templateDashboard) {
    	navigator.app.exitApp();
    } else {
    	inicio();
    }
    return false;
}

/** Función que mustra la página sin conexión. **/
function redirigirSinConexion() {
	redirigir(paginaSinConexion);
}

/** Funciones para FB **/
function init() {
	var networkState = navigator.connection.type;
	if (networkState == Connection.NONE || networkState == Connection.UNKNOWN) {
		mostrarSinConexion();
	} else {
		inicializar();
		FB.init({
			appId : appId,
			nativeInterface : CDV.FB,
			oauth : true,
			useCachedDialogs : false,
			frictionlessRequests : true
		});
	}
}

FB.Event.subscribe(
	'auth.login',
	function(responseS) {
		FB.getLoginStatus(function (response) {
			if (response.status == 'connected') {
				FB.api('/me', function (me) {
					if (!isCache('usuario') || getCache('usuario').facebook_id != me.id) {
						checkPermissions(function() {
							var params = {
								facebook_id	: me.id,
								first_name	: me.first_name,
								last_name	: me.last_name,
								email		: me.email
							};
							invocarLogin(params,
								function (response, textStatus, jqXHR) {
									setCache('usuario', response);
									iniciarProceso();
									registerWithFacebook();
								},
								function(jqXHR, textStatus, errorThrown) {
									alert('No pudimos conectarnos con el servidor de Adivina-Me, vuelve a intentarlo mas tarde.');
									mostrarConectar();
								});
						});
					} else {
						checkPermissions(function() {
							iniciarProceso();
						});
					}
				});
			} else {
				mostrarConectar();
			}
		});
	});

FB.Event.subscribe(
	'auth.logout',
	function(response) {
		mostrarConectar();
	});

function checkPermissions(funcionSuccess) {
	FB.api('/me/permissions',
		function (response) {
			var error = false;
			var perms = false;
			if (response.error) {
				error = true;
			} else {
				perms = response.data[0];
			}
			if (!(perms && perms.email)) {
				error = true;
			}
			
			if (error) {
				mostrarConectar();
			} else {
				funcionSuccess();
			}
		});
}

function inicializar() {
	// Sobreescribir con las acciones antes de continuar con el proceso de Facebook.
}

function iniciarProceso() {
	// Sobreescribir con las acciones a seguir una vez cargada la página.
}

function registerWithFacebook(){
	window.plugins.GCM.register(gApp.appId, "GCM_Event", GCM_Success, GCM_Fail );
	var xmlhttp=new XMLHttpRequest();
	xmlhttp.open("POST","http://"+URL+"/android_register.json",true);
	xmlhttp.setRequestHeader("Content-type","application/x-www-form-urlencoded");
	xmlhttp.send("regid="+gApp.gcmregid+"&facebook_id="+getCache('usuario').facebook_id);
	xmlhttp.onreadystatechange=function() {
		if (xmlhttp.readyState==4) {
    		console.log("Registration response: " + xmlhttp.responseText);
   		}
	}
}

function sendNotification(game_id, message, sound, badge) {
	var xmlhttp=new XMLHttpRequest();
	xmlhttp.open("POST","http://"+URL+"/send_notification_to_opponent.json",true);
	xmlhttp.setRequestHeader("Content-type","application/x-www-form-urlencoded");
	xmlhttp.send("game_id="+game_id+"&message="+message+"&sound="+sound+"&badge="+badge);
	xmlhttp.onreadystatechange=function() {
		if (xmlhttp.readyState==4) {
			console.log("Registration response: " + xmlhttp.responseText);
		}
	}
}

function mostrarConectar() {
	// Sobreescribir con las acciones a seguir cuando se desee mostrar el botón de 'conectar con FB'.
	redirigir(paginaIndex);
}

function login() {
	playAudio('click');
	$('#btn_conectar_fb').hide();
	FB.login(
		function (response) {
			if (response.authResponse) {
				removeCache('usuario');
				redirigir(paginaPrincipal);
			} else {
				mostrarConectar();
				alert("Tienes que conectar la aplicación a Facebook para poder continuar.");
			}
		},
		{ scope: "email"} // Android
		// { scope: "email,publish_stream"} // iOS
	);
}

/** Funciones generales **/
function inicio() {
	abrirTemplate(templateDashboard);
}

function refrescar() {
	// document.location.reload(true); //iOS
	
	pagina = window.location.href.substring(window.location.href.lastIndexOf('/')); //Android
	navigator.app.loadUrl("file:///android_asset/www" + pagina); //Android
}

function redirigir(pagina) {
	var paginaQS = '';
	if (pagina.indexOf('?') > 0) {
		paginaQS = pagina.substring(pagina.indexOf('?'));
		pagina = pagina.substring(0, pagina.indexOf('?'));
	} else {
		paginaQS = '?';
	}
	setCache('qs', paginaQS);
	
	// window.location = pagina; //iOS
	navigator.app.loadUrl("file:///android_asset/www/" + pagina); //Android
}

function obtenerParametro(name) {
	if (isCache('qs')) {
		qs = getCache('qs');
	} else {
		setCache('qs', '?');
		qs = '?';
	}
	name = name.replace(/[\[]/, "\\\[").replace(/[\]]/, "\\\]");
	var regexS = "[\\?&]" + name + "=([^&#]*)";
	var regex = new RegExp(regexS);
	var results = regex.exec(qs);
	if (results === null) {
		return "";
	} else {
		return decodeURIComponent(results[1].replace(/\+/g, " "));
	}
}

function limitaTexto(cadena, longitud) {
	var resultado = cadena;
	if (cadena.length > longitud) {
		resultado = cadena.substring(0, longitud) + '...';
	}
	return resultado;
}

var current_template = 0;
function abrirTemplate(template) {
	paginaActual = template;
	
	playAudio('click');
	current_template++;
	var number_template = current_template;
	load_template = $.ajax({
		url: template,
		success: function(data) {
			if (number_template == current_template) {
				$("#content_load").html(data);
			}
		}
	});
}

function obtenPrimerNombre(nombre) {
	if (nombre.indexOf(' ') > 0) {
		return nombre.substring(0, nombre.indexOf(' '));
	}
	return nombre;
}

function obtieneCarta(elemento, posicion, onclick, clases) {
	if (onclick === undefined) {
		onclick = '';
	}
	if (clases === undefined) {
		clases = '';
	}
                          
    if (elemento.estatus == 'bloqueado') {
        imagenCarta = 'img/ju_carta_bloqueada.png';
        clases += ' cartaBloqueada';
    } else {
        imagenCarta = 'img/ju_carta_logo.png';
    }
	
    return '<div id="' + elemento.id + '" class="carta cartaTablero ' + clases + '" posicion="' + posicion + '" tipo="' + elemento.template_id + '" onclick="' + onclick + '"><div class="front"><img id="thumb_loading_' + posicion + '" class="thumb_loading" src="img/loading_150.gif" /><img id="thumb_' + posicion + '" id_loader="thumb_loading_' + posicion + '" class="thumb" src="' + elemento.url + '"/><span class="nombre" nombre="' + elemento.description + '">' + limitaTexto(obtenPrimerNombre(elemento.description), 10) + '</span></div><div class="back"><img src="' + imagenCarta + '"/></div></div>';
}

function loaderCartas() {
	// Loader mientras cargan las cartas
	$('.thumb').load(function(event) {
		$('#' + $(event.target).attr('id_loader')).hide();
	});
}

function presionarBoton(elemento) {
    var source = elemento.attr('src');
    var arreglo = source.split('.');
    elemento.attr('src', arreglo[0] + '_over.' + arreglo[1]);
}
                          
function soltarBoton(elemento) {
    var source = elemento.attr('src');
    var arreglo = source.split('_over');
    elemento.attr('src', arreglo[0] + arreglo[1]);
}

/** Funciones para cache **/
function setCache(key, value) {
	window.localStorage.setItem(key, JSON.stringify(value));
}

function getCache(key) {
	return JSON.parse(window.localStorage.getItem(key));
}

function isCache(key) {
	return window.localStorage.getItem(key) !== null && window.localStorage.getItem(key) !== undefined;
}

function removeCache(key) {
	window.localStorage.removeItem(key);
}

function clearCache() {
	if (!isCache('aj_notificacion')) {
		setCache('aj_notificacion', true);
	}
	if (!isCache('aj_post')) {
		setCache('aj_post', true);
	}
	if (!isCache('aj_sonido')) {
		setCache('aj_sonido', true);
	}

	removeCache('usuario');
	removeCache('amigos');
	removeCache('partidas');
	
	removeCache('nuevo_oponente');
}

/** ALERTAS **/
var funciones;

var ALERTA_OK = 'OK';
var ALERTA_SI_NO = 'SI_NO';
var ALERTA_PREGUNTA = 'PREGUNTA';
var ALERTA_ADIVINAR_PREGUNTAR = 'ADIVINAR_PREGUNTAR';
var ALERTA_ADIVINAR = 'ADIVINAR';
var ALERTA_NUEVO_JUEGO = 'NUEVO_JUEGO';
var ALERTA_INPUT = 'INPUT';

function alert(texto, tipo, acciones) {
	playAudio('alert');
	
	if (texto === undefined) {
		texto = '';
	}
	if (tipo === undefined) {
		tipo = ALERTA_OK;
	}
	if (acciones === undefined) {
		acciones = new Array();
	}
	
	$('#alerta_input').val('');
	
	$('#scroller_' + tipo).html(texto);
	switch(tipo) {
		case ALERTA_PREGUNTA:
			if (texto.length <= 20) {
				$('.alerta[tipo="' + tipo + '"] .alerta_mensaje').css('padding-top', '15%');
			} else if (texto.length <= 40) {
				$('.alerta[tipo="' + tipo + '"] .alerta_mensaje').css('padding-top', '10%');
			} else if (texto.length <= 60) {
				$('.alerta[tipo="' + tipo + '"] .alerta_mensaje').css('padding-top', '5%');
			} else {
				$('.alerta[tipo="' + tipo + '"] .alerta_mensaje').css('padding-top', '0%');
			}
			$('.alerta[tipo="' + tipo + '"] .alerta_mensaje').css('padding-left', '5%');
			$('.alerta[tipo="' + tipo + '"] .alerta_botones').css('bottom', '5%');
			break;
		case ALERTA_INPUT:
			$('.alerta[tipo="' + tipo + '"] .alerta_mensaje').css('padding-top', '10%');
			$('.alerta[tipo="' + tipo + '"] .alerta_botones').css('bottom', '15%');
			break;
		case ALERTA_NUEVO_JUEGO:
			$('.alerta[tipo="' + tipo + '"] .alerta_mensaje').css('padding-top', '0%');
			$('.alerta[tipo="' + tipo + '"] .alerta_botones').css('bottom', '5%');
			break;
		default:
			if (texto.length <= 35) {
				$('.alerta[tipo="' + tipo + '"] .alerta_mensaje').css('padding-top', '15%');
				$('.alerta[tipo="' + tipo + '"] .alerta_botones').css('bottom', '20%');
			} else if (texto.length <= 70) {
				$('.alerta[tipo="' + tipo + '"] .alerta_mensaje').css('padding-top', '10%');
				$('.alerta[tipo="' + tipo + '"] .alerta_botones').css('bottom', '15%');
			} else if (texto.length <= 105) {
				$('.alerta[tipo="' + tipo + '"] .alerta_mensaje').css('padding-top', '5%');
				$('.alerta[tipo="' + tipo + '"] .alerta_botones').css('bottom', '10%');
			} else {
				$('.alerta[tipo="' + tipo + '"] .alerta_mensaje').css('padding-top', '0%');
				$('.alerta[tipo="' + tipo + '"] .alerta_botones').css('bottom', '5%');
			}
			break;
	}
	
	funciones = acciones;
	
	if (tipo == ALERTA_PREGUNTA && acciones['imagen']) {
		$('.alerta[tipo="' + tipo + '"]').children('.alerta_imagen').html(acciones['imagen']);
	}
	
	var scrollerTemp = new iScroll('mensaje_' + tipo);
    $('#alertas').fadeIn('fast', function() {
        $('.alerta[tipo="' + tipo + '"]').show();
        setTimeout(function () {
			scrollerTemp.refresh();
		}, 1000);
    });
	
	// navigator.notification.alert(texto, null, 'AdivinaMe'); // Alert original
}

function cerrarAlert() {
	$('#alertas').fadeOut('fast', function() {
		$('.alerta').hide();
	});
}

function ejecutaFuncion(nombre) {
	playAudio('click');
	cerrarAlert();
	
	needsScrollUpdate = true;
	$("html, body").animate({ scrollTop: 0 }, "fast");
	needsScrollUpdate = false;
	
	if (funciones[nombre]) {
		funciones[nombre]();
	}
}

/** Funciones de sonido **/
var audio_flip;
var audio_alerta;
var audio_click;

function createAudio(name) {
	// var src = ''; // iOS
	var src = 'file:///android_asset/www/'; // Android
	switch(name) {
		case 'flip':
			src += 'audio/flip.wav';
			break;
		case 'alert':
			src += 'audio/alerta.wav';
			break;
		case 'click':
			src += 'audio/click.wav';
			break;
		default:
			break;         
	}
		  
	// Create Media object from src
	my_media = new Media(src, function(){}, function(){});
						  
	return my_media;    
}

function playAudio(name) {
	if (getCache('aj_sonido')) {
		var src;
		switch(name) {
			case 'flip':
				if (audio_flip) {
					audio_flip.play();
				} else {
					audio_flip = createAudio('flip');
					audio_flip.play();
				}
				break;
			case 'alert':
				if (audio_alerta) {
					audio_alerta.play();
				} else {
					audio_alerta = createAudio('alert');
					audio_alerta.play();
				}
				break;
			case 'click':
				if (audio_click) {
					audio_click.play();
				} else {
					audio_click = createAudio('click');
					audio_click.play();
				}
				break;
			default:
				break;         
		}
	}      
}

/** Funciones de FB **/
function enviarPostFB(facebook_id, funcionSuccess) {
	if (getCache('aj_post')) {
		FB.ui({
			method: 'feed',
			to: facebook_id,
			link: 'http://apps.facebook.com/Adivina_Me/',
			picture: 'http://fbrell.com/f8.jpg',
			name: 'Adivina-Me',
			caption: '¡Te desafío en Adivina-Me!',
			description: 'Adivina el personaje que elegí en menos intentos que yo.'
        },
        function(response) {
			funcionSuccess(response);
        });
	} else {
		funcionSuccess(true);
	}
}

/** Funciones para inputs y textareas **/
var needsScrollUpdate = false;

$(document).scroll(function() {
	if (needsScrollUpdate) {
		setTimeout(function() {
			$("body").css("height", "+=1").css("height", "-=1");
		}, 0);
	}
});

$("input, textarea").live("focus", function(e) {
	needsScrollUpdate = true;
});

$("input, textarea").live("blur", function(e) {
	needsScrollUpdate = false;
});