import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UserMesReservationsComponent } from './user-mes-reservations.component';

describe('UserMesReservationsComponent', () => {
  let component: UserMesReservationsComponent;
  let fixture: ComponentFixture<UserMesReservationsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UserMesReservationsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UserMesReservationsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
