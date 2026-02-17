import { Routes } from '@angular/router';

export const routes: Routes = [
    {
        path: '',
        loadComponent: () =>
            import('./landing/landing-page/landing-page.component')
                .then(m => m.LandingPageComponent)
    },

    {
        path: 'patient',
        children: [
            {
                path: '',
                redirectTo: 'auth',
                pathMatch: 'full'
            },
            {
                path: 'auth',
                loadComponent: () =>
                    import('./features/patient/patient-auth/patient-auth.component')
                        .then(m => m.PatientAuthComponent)
            },
            {
                path: 'dashboard',
                loadComponent: () =>
                    import('./features/patient/patient-dashboard/patient-dashboard.component')
                        .then(m => m.PatientDashboardComponent)
            },
            {
                path: 'new-token',
                loadComponent: () =>
                    import('./features/patient/new-token/new-token.component')
                        .then(m => m.NewTokenComponent)
            },
            {
                path: 'my-token',
                loadComponent: () =>
                    import('./features/patient/my-token/my-token.component')
                        .then(m => m.MyTokenComponent)
            },
            {
                path: 'live-status',
                loadComponent: () =>
                    import('./features/patient/live-status/live-status.component')
                        .then(m => m.LiveStatusComponent)
            }
            ,
            {
                path: 'history',
                loadComponent: () =>
                    import('./features/patient/patient-history/patient-history.component')
                        .then(m => m.PatientHistoryComponent)
            },
            {
                path: 'history/:id',
                loadComponent: () =>
                    import('./features/patient/history-detail/history-detail.component')
                        .then(m => m.HistoryDetailComponent)
            }
            ,
            {
                path: 'notifications',
                loadComponent: () =>
                    import('./features/patient/patient-notification/patient-notification.component')
                        .then(m => m.PatientNotificationComponent)
            },
            {
                path: 'profile',
                loadComponent: () =>
                    import('./features/patient/patient-profile/patient-profile.component')
                        .then(m => m.PatientProfileComponent)
            }
        ]
    },

    {
        path: 'doctor',
        children: [
            {
                path: '',
                redirectTo: 'auth',
                pathMatch: 'full'
            },
            {
                path: 'auth',
                loadComponent: () =>
                    import('./features/doctor/doctor-auth/doctor-auth.component')
                        .then(m => m.DoctorAuthComponent)
            },
            {
                path: 'dashboard',
                loadComponent: () =>
                    import('./features/doctor/doctor-dashboard/doctor-dashboard.component')
                        .then(m => m.DoctorDashboardComponent)
            },
            {
                path: 'history',
                loadComponent: () =>
                    import('./features/doctor/patient-history/patient-history.component')
                        .then(m => m.PatientHistoryComponent)
            }
        ]
    }
    ,
    {
        path: 'reception',
        children: [
            {
                path: '',
                redirectTo: 'auth',
                pathMatch: 'full'
            },
            {
                path: 'auth',
                loadComponent: () =>
                    import('./features/reception/reception-auth/reception-auth.component')
                        .then(m => m.ReceptionAuthComponent)
            },
            {
                path: 'dashboard',
                loadComponent: () =>
                    import('./features/reception/reception-dashboard/reception-dashboard.component')
                        .then(m => m.ReceptionDashboardComponent)
            }
            ,
            {
                path: 'queue',
                loadComponent: () =>
                    import('./features/reception/reception-queue/reception-queue.component')
                        .then(m => m.ReceptionQueueComponent)
            }
        ]
    },
    {
        path: 'admin',
        children: [
            {
                path: '',
                redirectTo: 'auth',
                pathMatch: 'full'
            },
            {
                path: 'auth',
                loadComponent: () =>
                    import('./features/admin/admin-auth/admin-auth.component')
                        .then(m => m.AdminAuthComponent)
            },
            {
                path: 'overview',
                redirectTo: 'dashboard/overview'
            },
            {
                path: 'doctors',
                redirectTo: 'dashboard/doctors'
            },
            {
                path: 'departments',
                redirectTo: 'dashboard/departments'
            },
            {
                path: 'statistics',
                redirectTo: 'dashboard/statistics'
            },
            {
                path: 'dashboard',
                loadComponent: () =>
                    import('./features/admin/admin-dashboard/admin-dashboard.component')
                        .then(m => m.AdminDashboardComponent),
                children: [
                    {
                        path: '',
                        redirectTo: 'overview',
                        pathMatch: 'full'
                    },
                    {
                        path: 'overview',
                        loadComponent: () =>
                            import('./features/admin/admin-dashboard/admin-dashboard.component')
                                .then(m => m.AdminDashboardComponent)
                    },
                    {
                        path: 'doctors',
                        loadComponent: () =>
                            import('./features/admin/admin-dashboard/admin-dashboard.component')
                                .then(m => m.AdminDashboardComponent)
                    },
                    {
                        path: 'departments',
                        loadComponent: () =>
                            import('./features/admin/admin-dashboard/admin-dashboard.component')
                                .then(m => m.AdminDashboardComponent)
                    },
                    {
                        path: 'statistics',
                        loadComponent: () =>
                            import('./features/admin/admin-dashboard/admin-dashboard.component')
                                .then(m => m.AdminDashboardComponent)
                    }
                ]
            }
        ]
    }
];
