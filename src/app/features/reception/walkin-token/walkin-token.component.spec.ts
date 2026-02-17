import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WalkinTokenComponent } from './walkin-token.component';

describe('WalkinTokenComponent', () => {
  let component: WalkinTokenComponent;
  let fixture: ComponentFixture<WalkinTokenComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WalkinTokenComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(WalkinTokenComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
