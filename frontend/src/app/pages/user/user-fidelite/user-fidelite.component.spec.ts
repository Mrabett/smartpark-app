import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UserFideliteComponent } from './user-fidelite.component';

describe('UserFideliteComponent', () => {
  let component: UserFideliteComponent;
  let fixture: ComponentFixture<UserFideliteComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UserFideliteComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UserFideliteComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
