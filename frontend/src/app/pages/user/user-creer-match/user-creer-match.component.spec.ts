import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UserCreerMatchComponent } from './user-creer-match.component';

describe('UserCreerMatchComponent', () => {
  let component: UserCreerMatchComponent;
  let fixture: ComponentFixture<UserCreerMatchComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UserCreerMatchComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UserCreerMatchComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
