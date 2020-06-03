( function( global ){
	"use strict";
	const document = global.document;
	const window = global.window;
	if ( !document || !window ){
		throw new ReferenceError( "This environment requires a document or a window for this script to be used." );
	}
	const __VERSION__ = 0.4;
	const __ENV__ = "stable";
	const extend = ( target, ...sources ) => {
		if ( sources.length === 0 ) return target;
		loopSources: for ( let index = 0; index < sources.length; index++ ){
			let source = sources[ index ];
			if ( typeof source === "undefined" || source === null ) continue loopSources;
			loopProperties: for ( const property in source ){
				let originalValue = source[ property ];
				if ( typeof originalValue === "object" && originalValue !== null ){
					target[ property ] = Object.assign( {}, target[ property ] );
					extend( target[ property ], originalValue );
				} else if (typeof originalValue !== "undefined" || originalValue !== null){
					target[ property ] = source[ property ];
				} else continue loopProperties;
			}
		}
		return target;
	};

	var QUID = 0, CUID = 0;

	function Quake( name, options ){
		return new Quake.init( name, options );
	}

	Quake.extend = function( ...sources ){
		return extend( this, ...sources );
	};

	Quake.extend( {
		__VERSION__: __VERSION__,
		__ENV__: __ENV__,
		components: {},
		init: function( name, options ){
			if ( !( this instanceof Quake.init ) ){
				return new Quake.init( name, options );
			}

			if ( !( name in Quake.components ) ){ 
				throw new ReferenceError( "This component type does not exist." );
			}

			this.name = name;
			this.uid = QUID++;
			this.settings = Object.assign( {}, this.constructor.defaults );
			this.base = Quake.components[ name ];

			this.__configureOptions( options );

			return this;
		},
		createComponent: function( name, base ){
			let core = Quake.component, mixin;

			if ( Array.isArray( base ) ){
				base = extend( {}, ...base );
			}

			let constructor = function( element, options ){
				if ( !this.__create ) return new constructor( element, options );
				if ( arguments.length ) this.__create( element, options );
			};

			extend( constructor, {
				__proto: Object.assign( {}, base )
			} );

			mixin = new core();

			mixin.options = Object.assign( {}, mixin.options );

			constructor.prototype = extend( mixin, {
				constructor, name
			} );

			Quake.bridge( name, constructor );

			return constructor;
		},
		parseHTML: function( string ){
			const parser = new DOMParser();
			const body = parser.parseFromString( string, "text/html" ).body;
			if ( !body.firstElementChild ) return null;
			return body.firstElementChild;
		},
		bridge: function( name, constructor ){
			Quake.components[ name ] = function( state ){
				if ( arguments.length === 0 ) state = true;
				let component = new constructor();
				component.setState( state );
				this.uid = CUID++;
				return component;
			};
		}
	} );

	Quake.init.fn = Quake.init.prototype;

	Quake.init.extend = Quake.init.fn.extend = Quake.extend;

	Quake.init.extend( {
		defaults: Object.freeze( {
			id: '',
			classNames: [ ],
			data: { }
		} ),
		special: Object.freeze( {
			classNames: ( source, ...value ) => {
				for ( let index = 0; index < value.length; index++ ){
					let target = value[ index ];
					if ( Array.isArray( target ) ) source.push( ...target );
					else source.push( target );
				}
				source = source.filter( x => typeof x === "string" );
				return source;
			},
			data: ( source, ...object ) => {
				source = Object.assign( {}, source, ...object );
				return source;
			}
		} )
	} );

	Quake.init.fn.extend( {
		__configureOptions: function( options ){
			let component = new this.base();
			this.component = core;

			let componentDefaults = component.constructor.defaults;

			this.settings = Object.assign( { }, this.settings, componentDefaults);

			let specials = Object.assign( { }, this.constructor.special, component.constructor.special );

			for ( let property in options ){
				let value = options[ property ], original = this.settings[ property ];
				if ( property in specials ){
					let handler = specials[ property ];
					this.settings[ property ] = handler.call( this, value ) || original;
				} else {
					this.settings[ property ] = value || original;
				}
			}
		}
	} );

	global.Quake = Quake;
} )( globalThis );