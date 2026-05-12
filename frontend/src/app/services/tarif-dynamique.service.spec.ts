import { TestBed } from '@angular/core/testing';

import { TarifDynamiqueService } from './tarif-dynamique.service';

describe('TarifDynamiqueService', () => {
  let service: TarifDynamiqueService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TarifDynamiqueService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
