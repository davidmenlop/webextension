import { createHash, createHmac } from 'crypto';

export class Crypto {
  hashPayload? = async ( source: string ): Promise<string> => createHash( 'sha256' ).update( source ).digest( 'hex' );
  hashHMacPayload = async ( source: string, key: string ): Promise<string> => createHmac( 'sha256', key ).update( source, 'utf-8' ).digest( 'base64' );
}
