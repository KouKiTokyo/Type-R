import { IOEndpoint } from '../io-tools';
import { eventsApi, tools as _ } from '../object-plus';
import { CompiledReference } from '../traversable';
import { ChainableAttributeSpec } from './attrDef';
import { AnyType } from './metatypes';
import { ConstructorsMixin, constructorsMixin } from './updates';

export interface RecordAttributesMixin extends ConstructorsMixin {
    // Attributes descriptors
    _attributes : AttributeDescriptors
    _attributesArray : AnyType[]
    
    // Attribute's property descriptors
    properties : PropertyDescriptorMap

    // Event map for record's local events.
    _localEvents? : eventsApi.EventMap,

    _endpoints : { [ name : string ] : IOEndpoint }
}

export interface AttributeDescriptors {
    [ name : string ] : AnyType
}

// Create attribute from the type spec.
export function createAttribute( spec : any, name : string ) : AnyType {
    return AnyType.create( ChainableAttributeSpec.from( spec ).options, name );
}

// Create record mixin from the given record's attributes definition
export function createAttributesMixin( attributesDefinition : object, baseClassAttributes : AttributeDescriptors ) : RecordAttributesMixin {
    const myAttributes = _.transform( {} as AttributeDescriptors, attributesDefinition, createAttribute ),
          allAttributes = _.defaults( {} as AttributeDescriptors, myAttributes, baseClassAttributes );

    const ConstructorsMixin = constructorsMixin( allAttributes );

    return {
        ...ConstructorsMixin,
        _attributes : new ConstructorsMixin.AttributesCopy( allAttributes ),
        _attributesArray : Object.keys( allAttributes ).map( key => allAttributes[ key ] ),
        properties : _.transform( <PropertyDescriptorMap>{}, myAttributes, x => x.createPropertyDescriptor() ),
        ...localEventsMixin( myAttributes ),
        _endpoints : _.transform( {}, allAttributes, attrDef => attrDef.options.endpoint )
    }            
}

interface LocalEventsMixin {
    _localEvents? : eventsApi.EventMap
}

function localEventsMixin( attrSpecs : AttributeDescriptors ) : LocalEventsMixin {
    let _localEvents : eventsApi.EventMap;

    for( var key in attrSpecs ){
        const attribute = attrSpecs[ key ],
            { _onChange } = attribute.options; 

        if( _onChange ){
            _localEvents || ( _localEvents = new eventsApi.EventMap() );

            _localEvents.addEvent( 'change:' + key,
                typeof _onChange === 'string' ?
                    createWatcherFromRef( _onChange, key ) : 
                    wrapWatcher( _onChange, key ) );
        }
    }

    return _localEvents ? { _localEvents } : {};
}

function wrapWatcher( watcher, key ){
    return function( record, value ){
        watcher.call( record, value, key );
    } 
}

function createWatcherFromRef( ref : string, key : string ){
    const { local, resolve, tail } = new CompiledReference( ref, true );
    return local ?
        function( record, value ){
            record[ tail ]( value, key );
        } :
        function( record, value ){
            resolve( record )[ tail ]( value, key );
        }
}