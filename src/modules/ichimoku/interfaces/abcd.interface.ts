import ICandel from './candel.interface';

export default interface IAbcd {
  A: ICandel;
  B: ICandel;
  C: ICandel;
  D: ICandel;
  countBetweenAandB: number;
  countBetweenBandD: number;
}
