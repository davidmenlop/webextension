export const buildFormDataFrom = ( objKeyValue: any, objValue: any ) => {
  const formData = {};
  for ( const key of Object.keys( objKeyValue ) ) {
    if ( objKeyValue[key].includes( '.split.' ) ) {
      const propsKeys = objKeyValue[key].split( '.' );
      const value = splitStringToProps( objValue[propsKeys[0]] )[propsKeys[2]];
      formData[key] = value;
    } else {
      formData[key] = objValue[objKeyValue[key]];
    }
  }
  return formData;
};

export const compareHasEqualObj = ( objKeyValue: any, objFromKey: any, objToValue: any ) => {
  return Object.keys( objKeyValue ).every( key => objFromKey[key] === objToValue[objKeyValue[key]] );
};

export const splitStringToProps = ( text ) => {
  const arry = text.split( ' ' );
  const mitad = Math.floor( arry.length / 2 );
  const inicio = arry.slice( 0, mitad );
  const final = arry.slice( mitad );
  return [
    inicio.join( ' ' ),
    final.join( ' ' )
  ];
};
