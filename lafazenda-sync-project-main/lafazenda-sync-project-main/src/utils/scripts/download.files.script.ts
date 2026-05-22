import axios from 'axios';

const esmImport = async () =>
  new Function( `return import('file-type')` )();

export const downloadFileFromUrl = async ( url: string ) => {
  const response = await axios({
    method: 'GET',
    url: url,
    responseType: 'arraybuffer'
  });
  const buffer64 = Buffer.from( response.data, 'binary' );
  const func = await ( esmImport )();
  const fileInfo = await func.fileTypeFromBuffer( buffer64 );
  // console.warn( await func.fileTypeFromBuffer( buffer64 ) );

  const blob = new Blob( [ buffer64 ] );
  return { blob, fileInfo };
};
