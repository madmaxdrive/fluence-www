import assert from 'assert';
import BN from 'bn.js';
import { curves, ec } from 'elliptic';
import { BigNumber, providers, utils } from 'ethers';
import hash from 'hash.js'
import constantPointsHex from './constant_points.json';

const zero = new BN('0', 16);
const one = new BN('1', 16);

const prime = new BN('800000000000011000000000000000000000000000000000000000000000001', 16);
const maxEcdsaVal = new BN('800000000000000000000000000000000000000000000000000000000000000', 16);

const starkEC = new ec(new curves.PresetCurve({
      type: 'short',
      prime: null,
      p: '800000000000011000000000000000000000000000000000000000000000001',
      a: '1',
      b: '6f21413efbe40de150e596d72f7a8c5609ad26c15c915c1f4cdfcb99cee9e89',
      n: '800000000000010ffffffffffffffffb781126dcae7b2321e66a241adc64d2f',
      hash: hash.sha256,
      gRed: false,
      g: constantPointsHex[1],
}));

const constantPoints = constantPointsHex.map(coords => (
  starkEC.curve.point(new BN(coords[0], 16), new BN(coords[1], 16))));
const shiftPoint = constantPoints[0];

type BNC = number | string | number[] | Uint8Array | Buffer | BN;

/*
 Full specification of the hash function can be found here:
   https://starkware.co/starkex/docs/signatures.html#pedersen-hash-function
 shiftPoint was added for technical reasons to make sure the zero point on the elliptic curve does
 not appear during the computation. constantPoints are multiples by powers of 2 of the constant
 points defined in the documentation.
*/
function pedersen(a: BNC, b: BNC = 0): BN {
      const inputs = [a, b];

      let point = shiftPoint;
      for (let i = 0; i < inputs.length; i++) {
            let x = new BN(inputs[i], 16);
            assert(x.gte(zero) && x.lt(prime), 'Invalid input: ' + inputs[i]);
            for (let j = 0; j < 252; j++) {
                  const pt = constantPoints[2 + i * 252 + j];
                  assert(!point.getX().eq(pt.getX()));
                  if (x.and(one).toNumber() !== 0) {
                        point = point.add(pt);
                  }
                  x = x.shrn(1);
            }
      }

      return point.getX();
}

export function pedersen_hash(messages: BNC[]): BN {
      return messages.reduceRight<BN>((s, x) => pedersen(x, s), new BN(0));
}

export function derive_path(account: string, index: number = 1): string {
      const purpose = 2645;
      const m = BigNumber.from(1).shl(31).sub(1);
      const layer = BigNumber.from(utils.sha256(utils.toUtf8Bytes('starkex'))).and(m);
      const application = BigNumber.from(utils.sha256(utils.toUtf8Bytes('immutablex'))).and(m);
      const address = BigNumber.from(account);
      const address1 = address.and(m);
      const address2 = address.shr(31).and(m);

      return `m/${purpose}'/${layer}'/${application}'/${address1}'/${address2}'/${index}`;
}

const SECP256K1_N = BigNumber.from('0xfffffffffffffffffffffffffffffffebaaedce6af48a03bbfd25e8cd0364141');
const EC_ORDER = BigNumber.from(String(starkEC.n));

export function derive_private_key(account: string, seed: string): BigNumber {
      const hd = utils.HDNode.fromSeed(seed);
      const derived = hd.derivePath(derive_path(account, 1)).privateKey;

      const n = SECP256K1_N.sub(SECP256K1_N.mod(EC_ORDER));
      for (let i = 0; ; i++) {
            const k = BigNumber.from(utils.sha256(utils.hexConcat([derived, i as any])));
            if (k.lt(n)) {
                  return k.mod(EC_ORDER);
            }
      }
}

export function private_to_stark_key(private_key: BigNumber): BN {
      const key_pair = starkEC.keyFromPrivate(private_key.toHexString().slice(2));

      return key_pair.getPublic().getX();
}

/*
 Asserts input is equal to or greater then lowerBound and lower then upperBound.
 Assert message specifies inputName.
 input, lowerBound, and upperBound should be of type BN.
 inputName should be a string.
*/
function assertInRange(
  input: BN,
  lowerBound: BN,
  upperBound: BN,
  inputName = ''
) {
      const messageSuffix = inputName === '' ? 'invalid length' : `invalid ${inputName} length`;
      assert(
        input.gte(lowerBound) && input.lt(upperBound), `Message not signable, ${messageSuffix}.`
      );
}

/*
 The function _truncateToN in lib/elliptic/ec/index.js does a shift-right of delta bits,
 if delta is positive, where
   delta = msgHash.byteLength() * 8 - starkEx.n.bitLength().
 This function does the opposite operation so that
   _truncateToN(fixMsgHashLen(msgHash)) == msgHash.
*/
function fixMsgHashLen(msgHash: BNC) {
      // Convert to BN to remove leading zeros.
      msgHash = new BN(msgHash, 16).toString(16);

      if (msgHash.length <= 62) {
            // In this case, msgHash should not be transformed, as the byteLength() is at most 31,
            // so delta < 0 (see _truncateToN).
            return msgHash;
      }
      assert(msgHash.length === 63);
      // In this case delta will be 4 so we perform a shift-left of 4 bits by adding a zero.
      return msgHash + '0';
}

export function sign(private_key: BigNumber, message: BN) {
      const key_pair = starkEC.keyFromPrivate(private_key.toHexString().slice(2));
      // Verify message hash has valid length.
      assertInRange(message, zero, maxEcdsaVal, 'msgHash');
      const signature = key_pair.sign(fixMsgHashLen(message));
      const { r, s } = signature;
      const w = s.invm(starkEC.n as BN);
      // Verify signature has valid length.
      assertInRange(r, one, maxEcdsaVal, 'r');
      assertInRange(s, one, starkEC.n as BN, 's');
      assertInRange(w, one, maxEcdsaVal, 'w');

      return signature;
}

export class StarkSigner {
      constructor(private account: string, private provider: providers.Web3Provider) {
      }

      async derive_stark_key() {
            return private_to_stark_key(await this.derive_private_key());
      }

      async sign(messages: BNC[]): Promise<[BN, ec.Signature]> {
            const private_key = await this.derive_private_key();
            console.log(String(private_key));
            console.log(messages);

            return [private_to_stark_key(private_key), sign(private_key, pedersen_hash(messages))];
      }

      private async derive_private_key() {
            const signature_str = await this.provider.getSigner(this.account)
              .signMessage('Only sign this request if you’ve initiated an action with Immutable X.');
            const signature = utils.splitSignature(signature_str);

            return derive_private_key(this.account, signature.s);
      }
}
