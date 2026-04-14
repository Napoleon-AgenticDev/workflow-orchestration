import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { Router } from '@angular/router';
import { By } from '@angular/platform-browser';
import { MenubarModule } from 'primeng/menubar';
import { ButtonModule } from 'primeng/button';
import { SplitButtonModule } from 'primeng/splitbutton';
import { AvatarModule } from 'primeng/avatar';
import { BadgeModule } from 'primeng/badge';
import { App } from './app';
import { Routes } from '@angular/router';

describe('App Component', () => {
  let component: App;
  let fixture: ComponentFixture<App>;
  let router: Router;

  const testRoutes: Routes = [
    { path: 'dashboard', loadComponent: () => import('./pages/dashboard/dashboard.component').then(m => m.DashboardComponent) },
    { path: 'templates', loadComponent: () => import('./pages/workflows/workflows.component').then(m => m.WorkflowsComponent) },
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        RouterTestingModule.withRoutes(testRoutes),
        App,
        MenubarModule,
        ButtonModule,
        SplitButtonModule,
        AvatarModule,
        BadgeModule,
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(App);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    fixture.detectChanges();
  });

  // ============================================
  // HAPPY PATH TESTS
  // ============================================

  describe('Component Initialization', () => {
    it('should create the app component', () => {
      expect(component).toBeTruthy();
    });

    it('should initialize with dashboard view', () => {
      expect(component.currentView).toBe('dashboard');
    });

    it('should have default projects loaded', () => {
      expect(component.projects.length).toBe(3);
    });

    it('should have first project selected by default', () => {
      expect(component.selectedProject).toBeDefined();
      expect(component.selectedProject.name).toBe('Marketing Automation');
    });

    it('should generate correct project menu items', () => {
      expect(component.projectMenuItems.length).toBe(5); // 3 projects + separator + Create New
    });
  });

  describe('Navigation - Happy Path', () => {
    it('should navigate to dashboard when dashboard button clicked', () => {
      const navigateSpy = spyOn(router, 'navigate');
      
      component.navigateTo('dashboard');
      
      expect(component.currentView).toBe('dashboard');
      expect(navigateSpy).toHaveBeenCalledWith(['/dashboard']);
    });

    it('should navigate to templates when templates button clicked', () => {
      const navigateSpy = spyOn(router, 'navigate');
      
      component.navigateTo('templates');
      
      expect(component.currentView).toBe('templates');
      expect(navigateSpy).toHaveBeenCalledWith(['/templates']);
    });

    it('should update currentView state when toggling', () => {
      component.navigateTo('templates');
      expect(component.currentView).toBe('templates');
      
      component.navigateTo('dashboard');
      expect(component.currentView).toBe('dashboard');
    });
  });

  describe('Project Selection - Happy Path', () => {
    it('should select a different project', () => {
      const newProject = component.projects[1];
      
      component.selectProject(newProject);
      
      expect(component.selectedProject).toBe(newProject);
      expect(component.selectedProject.name).toBe('CI/CD Pipeline');
    });

    it('should allow selecting all available projects', () => {
      component.projects.forEach(project => {
        component.selectProject(project);
        expect(component.selectedProject.id).toBe(project.id);
      });
    });
  });

  describe('Template Rendering - Happy Path', () => {
    it('should render logo', () => {
      const logoElement = fixture.debugElement.query(By.css('.logo'));
      expect(logoElement).toBeTruthy();
      expect(logoElement.nativeElement.textContent).toContain('Alchemy Flow');
    });

    it('should render both toggle buttons', () => {
      const buttons = fixture.debugElement.queryAll(By.css('.toggle-btn'));
      expect(buttons.length).toBe(2);
    });

    it('should have dashboard button active by default', () => {
      const dashboardBtn = fixture.debugElement.query(By.css('.toggle-btn.active'));
      expect(dashboardBtn).toBeTruthy();
      expect(dashboardBtn.nativeElement.textContent).toContain('Dashboard');
    });

    it('should render project selector', () => {
      const projectSelector = fixture.debugElement.query(By.css('.project-selector'));
      expect(projectSelector).toBeTruthy();
    });

    it('should render user avatar', () => {
      const avatar = fixture.debugElement.query(By.css('.user-avatar'));
      expect(avatar).toBeTruthy();
    });

    it('should render router outlet', () => {
      const routerOutlet = fixture.debugElement.query(By.css('router-outlet'));
      expect(routerOutlet).toBeTruthy();
    });
  });

  describe('Project Menu - Happy Path', () => {
    it('should include all project names in menu', () => {
      const labels = component.projectMenuItems.map(item => item.label);
      expect(labels).toContain('Marketing Automation');
      expect(labels).toContain('CI/CD Pipeline');
      expect(labels).toContain('Lead Management');
    });

    it('should include create new project option', () => {
      const createItem = component.projectMenuItems.find(item => item.label === 'Create New Project');
      expect(createItem).toBeTruthy();
      expect(createItem?.icon).toBe('pi pi-plus');
    });
  });

  // ============================================
  // NEGATIVE PATH TESTS
  // ============================================

  describe('Error Handling', () => {
    it('should handle empty projects array', () => {
      component.projects = [];
      component.selectedProject = undefined as any;
      
      fixture.detectChanges();
      
      const projectSelector = fixture.debugElement.query(By.css('.project-selector'));
      const newProjectBtn = fixture.debugElement.query(By.css('.nav-right p-button'));
      
      expect(projectSelector).toBeFalsy();
      expect(newProjectBtn).toBeTruthy();
    });

    it('should handle createProject without projects', () => {
      const consoleSpy = spyOn(console, 'log');
      component.projects = [];
      
      component.createProject();
      
      expect(consoleSpy).toHaveBeenCalledWith('Create new project');
    });
  });

  describe('View Toggle State', () => {
    it('should have correct initial state', () => {
      expect(component.currentView).toBe('dashboard');
    });

    it('should toggle view correctly multiple times', () => {
      component.navigateTo('templates');
      expect(component.currentView).toBe('templates');
      
      component.navigateTo('dashboard');
      expect(component.currentView).toBe('dashboard');
      
      component.navigateTo('templates');
      expect(component.currentView).toBe('templates');
    });
  });

  // ============================================
  // ALTERNATE FLOW TESTS
  // ============================================

  describe('Alternate Project Selection', () => {
    it('should switch between projects correctly', () => {
      // Select first project
      component.selectProject(component.projects[0]);
      expect(component.selectedProject.id).toBe('proj-1');
      
      // Select second project
      component.selectProject(component.projects[1]);
      expect(component.selectedProject.id).toBe('proj-2');
      
      // Select third project
      component.selectProject(component.projects[2]);
      expect(component.selectedProject.id).toBe('proj-3');
    });
  });

  describe('Navigation Alternate Flows', () => {
    it('should update button active state on navigation', () => {
      fixture.detectChanges();
      
      // Initially dashboard should be active
      let activeButton = fixture.debugElement.query(By.css('.toggle-btn.active'));
      expect(activeButton.nativeElement.textContent).toContain('Dashboard');
      
      // Navigate to templates
      component.navigateTo('templates');
      fixture.detectChanges();
      
      // Now templates should be active
      activeButton = fixture.debugElement.query(By.css('.toggle-btn.active'));
      expect(activeButton.nativeElement.textContent).toContain('Templates');
    });
  });

  describe('Create Project Function', () => {
    it('should call createProject when clicked', () => {
      const consoleSpy = spyOn(console, 'log');
      component.projects = []; // Ensure no projects
      
      fixture.detectChanges();
      
      component.createProject();
      
      expect(consoleSpy).toHaveBeenCalledWith('Create new project');
    });
  });

  describe('Template Rendering Edge Cases', () => {
    it('should render logo with emoji', () => {
      const logo = fixture.debugElement.query(By.css('.logo'));
      expect(logo.nativeElement.textContent).toContain('⚗️');
    });

    it('should have both view toggle buttons visible', () => {
      fixture.detectChanges();
      
      const buttons = fixture.debugElement.queryAll(By.css('.toggle-btn'));
      const texts = buttons.map(btn => btn.nativeElement.textContent);
      
      expect(texts).toContain('Dashboard');
      expect(texts).toContain('Templates');
    });

    it('should render navigation sections', () => {
      const navLeft = fixture.debugElement.query(By.css('.nav-left'));
      const navCenter = fixture.debugElement.query(By.css('.nav-center'));
      const navRight = fixture.debugElement.query(By.css('.nav-right'));
      
      expect(navLeft).toBeTruthy();
      expect(navCenter).toBeTruthy();
      expect(navRight).toBeTruthy();
    });
  });
});
