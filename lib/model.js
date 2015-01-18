/**
 * model.js
 */

var _models = [];

module.exports = {
	validateModelName: function( modelName ) {
		if( ! modelName ) {
			console.error("ERROR: model name can't be null.");
			return null;
		} else if( modelName.match(/\s+/) ) {
			console.error( "ERROR: model name must not contain whitepace" );
			return null;
		} 
		return modelName.toLowerCase();
	},

	model: function( name ) {
		name = this.validateModelName( name );
		return _models[ name.toLowerCase() ];
	},

	addModel: function( modelName, schema, conn ) {
		modelName = this.validateModelName( modelName );
		return _models[ modelName ] = conn.model( modelName, schema );
	}
};	



