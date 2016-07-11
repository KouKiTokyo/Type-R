/*******
 * 
 */


export function emptySetTransaction( collection : Collection, items : Elements, options : CollectionOptions, silent? : boolean ){
    const isRoot = begin( collection );

    const added = _reallocateEmpty( collection, items, options );

    if( added.length ){
        const needSort = makeSorted( collection, options );
        return new CollectionTransaction( collection, isRoot, added, [], [], needSort );
    }

    // No changes...
    isRoot && commit( collection, options );
};

export function setTransaction( collection, items, options ){
    const isRoot = begin( collection ),
          nested = [];

    var previous = collection.models,
        added    = _reallocate( collection, items, nested, options );

    const reusedCount = collection.models.length - added.length,
          removed = reusedCount < previous.length ? (
                        reusedCount ? _garbageCollect( collection, previous ) :
                                        freeAll( collection, previous )
                    ) : [];                    
    
    const addedOrChanged = nested.length || added.length,
          needSort = addedOrChanged && makeSorted( collection, options );

    if( addedOrChanged || removed.length ){
        return new CollectionTransaction( collection, isRoot, added, removed, nested, needSort );
    }

    isRoot && commit( collection, options );
};

// Remove references to all previous elements, which are not present in collection.
// Returns an array with removed elements.
function _garbageCollect( collection : Collection, previous : Record[] ) : Record[]{
    const { _byId }  = collection,
          removed = [];

    // Filter out removed models and remove them from the index...
    for( let record of previous ){
        if( !_byId[ record.cid ] ){
            removed.push( record );
            free( collection, record );
        }
    }

    return removed;
}

// reallocate model and index
function _reallocate( collection : Collection, source, nested : Transaction[], options ){
    var models      = Array( source.length ),
        _byId : Index = {},
        merge       = options.merge == null ? true : options.merge,
        _prevById   = collection._byId,
        idAttribute = collection.model.prototype.idAttribute,
        toAdd       = [];

    // for each item in source set...
    for( var i = 0, j = 0; i < source.length; i++ ){
        var item  = source[ i ],
            model = null;

        if( item ){
            var id  = item[ idAttribute ],
                cid = item.cid;

            if( _byId[ id ] || _byId[ cid ] ) continue;

            model = _prevById[ id ] || _prevById[ cid ];
        }

        if( model ){
            if( merge && item !== model ){
                var attrs = item.attributes || item;
                const transaction = model.createTransaction( attrs, options );
                transaction && nested.push( transaction );
            }
        }
        else{
            model = convertAndRef( collection, item, options );
            toAdd.push( model );
        }

        models[ j++ ] = model;
        addIndex( _byId, model );
    }

    models.length = j;
    collection.models   = models;
    collection._byId    = _byId;

    return toAdd;
}

function _reallocateEmpty( self, source, options ){
    var len         = source ? source.length : 0,
        models      = Array( len ),
        _byId       = {},
        idAttribute = self.model.prototype.idAttribute;

    for( var i = 0, j = 0; i < len; i++ ){
        var src = source[ i ];

        if( src && ( _byId[ src[ idAttribute ] ] || _byId[ src.cid ] ) ){
            continue;
        }

        var model = toModel( self, src, options );

        addReference( self, model );
        models[ j++ ] = model;
        addIndex( _byId, model );

    }

    models.length = j;
    self._byId    = _byId;

    return self.models = models;
}