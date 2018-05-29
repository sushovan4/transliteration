(function ( $ ) {
    
    $.fn.transliterator = function( options ) {

	this.each(function( ) {
	    var elem    = $( this );
	    var settings = $.extend({
		locale: elem.data('locale'),
	    }, options );
	    
	    if ( settings.locale == '' || settings.locale == 'en' ) return;
	    
	    elem.after( '<div class="tr-popup">' + settings.locale +
			'<div class="edit"></div>' +
			'<div class="div">' +
			'<div class="list"></div>'
			+ '</div></div>' );

	    var popup = elem.next( );

	    popup.hide( );
	    
	    popup
		.on('click', '.can', function( ){
		    var tr = $(this).data('tr');
		    document.execCommand('insertText', false, tr);
		    cleanPopup( );
		})
	    ;
	    
	    elem
		.focusout( function( ){
		    cleanPopup( elem );
		})
	    ;
	    
	    elem
		.keydown( function(event) {
		    if ( event.ctrlKey ) return;
		    
 		    var keyCode    = event.which;
		    var ch = String.fromCharCode(keyCode);
		    if (!event.shiftKey)
			ch = String.fromCharCode(keyCode + 32);
		    var popped     = popup.is(':visible');
		    var totalCans  = popup.find('.can').length;
		    var text       = popup.find('.edit').text( );
		    
		    // Alphabet is pressed
		    if ( 65 <= keyCode && keyCode <= 90 ) { 
			event.preventDefault( );
			showPopup(elem, text + ch, settings.locale);
		    }
		    
		    // 0-9 is pressed
		    else if ( 48 <= keyCode && keyCode <= 57 ) {
 			event.preventDefault( );		
			var num = keyCode - 48;
			if ( popped && num <= totalCans) {
			    var tr = popup.find('.list [data-rank='+num+']').data('tr');
			    insertText(elem, tr);
			}
			else {
			    showPopup(elem, text + num, settings.locale);
			}
		    }
		    
		    // Num 0 - Num 9 is pressed
		    else if (97 <= keyCode && keyCode <= 122 ) {
 			event.preventDefault( );		
			var num = keyCode - 96;
			if ( popped && num <= totalCans) {
			    var tr = popup.find('.list [data-rank='+num+']').data('tr');
			    insertText(elem, tr);
			}
			else {
			    showPopup(elem, text + num, settings.locale);
			}
		    }
		    
		    // Period
		    else if ( keyCode == 190 ) {
			event.preventDefault( );
 			if ( popped ) {
		    	    var tr = popup.find('.hlt').data('tr');
			    insertText(elem, tr + '।' );
			}
			else {
			    //
			}
		    }
		    
		    // Right or down arrow is pressed
		    else if ( ( keyCode == 40 || keyCode == 39) && totalCans > 0  ) {
			event.preventDefault( );
			var hlt = popup.find('.hlt');
			if ( !hlt.is(':last-child') ) {
			    hlt.removeClass('hlt');
			    hlt.next( ).addClass('hlt');
			}
		    }
		    
		    // Left or up arrow is pressed
		    else if ( ( keyCode == 38 || keyCode == 37 ) && totalCans > 0 ) {
			event.preventDefault( );
			var hlt = popup.find('.hlt');
			if ( !hlt.is(':first-child') ) {
			    hlt.removeClass('hlt');
			    hlt.prev( ).addClass('hlt');
			    
			}
		    }
		    
		    // Enter or space is pressed
		    else if ( ( keyCode == 13 || keyCode == 32 ) && popped )  {
			event.preventDefault( );
			var tr = popup.find('.hlt').data('tr');
			insertText( elem, tr );
		    }
		    
		    // Escape is pressed
		    else if ( keyCode == 27 && popped )
			cleanPopup( elem );
		    
		    
		    // Backspace
		    else if ( keyCode == 8 && popped ) {
			event.preventDefault( );
			if ( text.length >= 2 )
			    showPopup(elem,
				      text.substring(0, text.length - 1),
				      settings.locale);
			
			else
			    cleanPopup( elem );
			
		    }
		})
	});
    };
    
    var showPopup = function( elem, text, locale ) {
	var popup      = elem.next( );
	var base_url   = "https://inputtools.google.com/request?"
	var params     = "text=" + text +
	    "&itc=" +locale+ "-t-i0-und&num=13&cp=0&cs=1&ie=utf-8&oe=utf-8&app=demopage"
	var list       = popup.find('.list');
	cleanPopup( elem );
	popup.find('.edit').text(text);
	list.append('<div class="hlt can" data-tr="'
	    	    +text+
	    	    '" data-rank="'+ 0 + '">'
	    	    + String(0).bn( )
	    	    + '. ' + text +'</div>');
	//Position the popup
	if ( elem.nodeName == 'INPUT' || elem.nodeName == 'TEXTAREA' ) {
	    var coordinates = getCaretCoordinates(elem[0],
						  elem[0].selectionEnd);
	}
	
	else {
	    var coordinates = elem.position( );
	}
	popup.css({top: coordinates.top, left: coordinates.left});
	popup.show();
	
	// if ( request ) { request.abort( ); }
	var request = $.ajax({
	    method: 'POST',
	    url: base_url + params,
	    dataType: 'json',
	    success: function(result) {
		list.find('.hlt').removeClass('hlt');
		var candidates = result[1][0][1];
		for (i=0; i < Math.min(9, candidates.length); i++) {
	    	    if ( i==0 ){
	    		list
	    		    .append('<div class="can hlt" data-tr="'
	    			    +candidates[i]+
	    			    '" data-rank="'+ (i+1) + '">'
	    			    + String(i+1).bn( )
	    			    + '. ' + candidates[i]+'</div>');
	    	    }
	    	    else {
	    		list
	    		    .append( '<div class="can" data-tr="'
	    			     +candidates[i]+'" data-rank="'+ (i+1) + '">'
	    			     + String(i+1).bn( )
	    			     + '. ' + candidates[i]+'</div>');
	    	    }
		}
		
	    }
	});
	
    }

    function insertText(elem, text) {
	if ( elem[0].nodeName == 'INPUT' || elem[0].nodeName == 'TEXTAREA' ) {
	    var selStart = elem.prop('selectionStart');
	    var selEnd = elem.prop('selectionEnd');
	    var val    = elem.val( );
	    var before = val.substring(0, selStart);
	    var after  = val.substring(selEnd, val.length);
	    elem.val( before + text + after );
	    elem[0].setSelectionRange(selEnd + text.length, selEnd + text.length,
				      'forward');
	}
	else
	    document.execCommand('insertText', false, text);
	cleanPopup(elem);
    }
    
    function cleanPopup( elem ){
	var popup = elem.next( );
	popup.find('.can').remove( );
	popup.find('.edit').text( '' );
	popup.hide( );    
    }
    
}( jQuery ) );

var finalEnlishToBanglaNumber=
    {'0':'০','1':'১','2':'২','3':'৩','4':'৪','5':'৫','6':'৬','7':'৭','8':'৮','9':'৯'
    };

String.prototype.bn = function() {
    var retStr = this;
    for (var x in finalEnlishToBanglaNumber) {
	retStr = retStr.replace(new RegExp(x, 'g'), finalEnlishToBanglaNumber[x]);
    }
    return retStr;
};

