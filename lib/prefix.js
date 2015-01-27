/**
 * prefix.js
 */

var _prefix = "";

module.exports = function( s ) {
	if( s == undefined ) {
		// GET
		return _prefix;
	}
	// SET
	if( ! s ) {
		console.error("ERROR: prefix can't be null.");
	} else if( ! s.match(/^\//) ) {
		console.error( "ERROR: prefix must begin with a slash" );
	} else if( s.match(/\/$/) ) {
		console.error( "ERROR: prefix must not end with a slash" );
	} else if( s.match(/\s+/) ) {
		console.error( "ERROR: prefix must not contain whitepace" );
	} else {
		_prefix = s.toLowerCase();
	}
};
