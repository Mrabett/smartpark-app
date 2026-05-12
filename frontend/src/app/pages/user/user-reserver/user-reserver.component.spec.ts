import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UserReserverComponent } from './user-reserver.component';

describe('UserReserverComponent', () => {
  let component: UserReserverComponent;
  let fixture: ComponentFixture<UserReserverComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UserReserverComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UserReserverComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
