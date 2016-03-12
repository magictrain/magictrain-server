/**
 * Update doc if exists, insert a new one if not
 * @param: docId
 * @param: callback(doc), return updated document by the caller
 * @param: done( err, doc ) status callback
 */
this.upsert = function( db, docId, callback, done ){
	var insert = function( body ){
		//Let caller modify doc if already exists, caller can replace with entirely new doc, however, doc id will be reestablished if doc already exists
		var id = body && (body._id || body.id);
		var rev = body && (body._rev || body.rev);
		body = callback( body );				
		if ( body ){
			body._id = id || body._id || undefined;
			body._rev = rev || body._rev || undefined;
				
			db.insert( body, body._id, function( err, data ){
				if ( err ){
					console.log( "Error while saving doc: " + err + ".Doc id: " + body._id + " Doc rev: " + body._rev);
					return done(err);
				}
				//always set the id and rev if available
				body._id = (data && (data.id || data._id)) || body._id;
				body._rev = (data && (data.rev || data._rev)) || body._rev;
				return done( null, body );
			});
		}else{
			//Caller didn't give us the data, return error
			return done("Error during upsert: Caller didn't return a valid document");
		}
	};
		
	if ( !docId ){
		return insert( null );
	}

	//We have a docId, load it
	db.get( docId, { include_docs: true }, function( err, body ){				
		return insert( body );
	});
}