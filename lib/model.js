/**
 * model.js
 */

var _models = [];

module.exports = {
	normalizeModelName: function( modelName ) {
		if( ! modelName ) {
			throw new Error("ERROR: model name can't be null.");
		} else if( modelName.match(/\s+/) ) {
			throw new Error( "ERROR: model name must not contain whitespace" );
		} 
		return modelName.toLowerCase();
	},

	model: function( name ) {
		name = this.normalizeModelName( name );
		return _models[ name.toLowerCase() ];
	},

	addModel: function( modelName, schema, conn ) {
		modelName = this.normalizeModelName( modelName );
		return _models[ modelName ] = conn.model( modelName, schema );
	}
};	



