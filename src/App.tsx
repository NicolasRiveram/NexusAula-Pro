import { Toaster } from "@/components/ui/toaster";
    import { Toaster as Sonner } from "@/components/ui/sonner";
    import { TooltipProvider } from "@/components/ui/tooltip";
    import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
    import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";
    import { useState, useEffect } from "react";
    import { Session } from "@supabase/supabase-js";
    import { supabase } from "@/integrations/supabase/client";
    import Index from "./pages/Index";
    import Login from "./pages/Login";
    import Dashboard from "./pages/Dashboard"; 
    import CoursesPage from "./pages/dashboard/CoursesPage";
    import SchedulePage from "./pages/dashboard/SchedulePage";
    import DidacticPlannerPage from "./pages/dashboard/DidacticPlannerPage";
    import NewUnitPlan from "./pages/dashboard/planning/NewUnitPlan";
    import EditUnitPlanPage from "./pages/dashboard/planning/EditUnitPlanPage";
    import UnitPlanDetailPage from "./pages/dashboard/planning/UnitPlanDetailPage";
    import EvaluationPage from "./pages/dashboard/EvaluationPage";
    import EvaluationBuilderPage from "./pages/dashboard/evaluations/EvaluationBuilderPage";
    import EvaluationDetailPage from "./pages/dashboard/evaluations/EvaluationDetailPage";
    import EvaluationResultsPage from "./pages/dashboard/evaluations/EvaluationResultsPage";
    import EvaluationTakerPage from "./pages/dashboard/evaluations/EvaluationTakerPage";
    import EvaluationScannerPage from "./pages/dashboard/evaluations/EvaluationScannerPage";
    import ProjectsPage from "./pages/dashboard/ProjectsPage";
    import ProjectDetailPage from "./pages/dashboard/ProjectDetailPage";
    import SettingsPage from "./pages/dashboard/SettingsPage";
    import CourseDetailPage from "./pages/dashboard/CourseDetailPage";
    import StudentDetailPage from "./pages/dashboard/StudentDetailPage";
    import ProfileSetup from "./pages/ProfileSetup";
    import NotFound from "./pages/NotFound";
    import { EstablishmentProvider } from "./contexts/EstablishmentContext";
    import { DesignProvider } from "./contexts/DesignContext";
    import BitacoraPage from "./pages/dashboard/BitacoraPage";
    import RubricsPage from "./pages/dashboard/RubricsPage";
    import RubricBuilderPage from "./pages/dashboard/rubrics/RubricBuilderPage";
    import EditRubricPage from "./pages/dashboard/rubrics/EditRubricPage";
    import RubricDetailPage from "./pages/dashboard/rubrics/RubricDetailPage";
    import AnalyticsPage from "./pages/dashboard/AnalyticsPage";
    import StudentResponseDetailPage from "./pages/dashboard/evaluations/StudentResponseDetailPage";
    import DashboardIndex from "./pages/dashboard/DashboardIndex";
    import ManageCoursesPage from "./pages/dashboard/admin/ManageCoursesPage";
    import ManageCalendarPage from "./pages/dashboard/admin/ManageCalendarPage";
    import DesignManagementPage from "./pages/dashboard/admin/DesignManagementPage";
    import StudentSchedulePage from "./pages/dashboard/student/StudentSchedulePage";
    import MyProgressPage from "./pages/dashboard/student/MyProgressPage";
    import ReportsPage from "./pages/dashboard/reports/ReportsPage";
    import GenerateReportPage from "./pages/dashboard/reports/GenerateReportPage";
    import ViewReportPage from "./pages/dashboard/reports/ViewReportPage";
    import ExpertGeneratorPage from "./pages/dashboard/super-admin/ExpertGeneratorPage";

    const queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          refetchOnWindowFocus: false,
        },
      },
    });

    const AppContent = () => {
      const [session, setSession] = useState<Session | null>(null);
      const [loading, setLoading] = useState(true);
      const [profileComplete, setProfileComplete] = useState<boolean | null>(null);
      const navigate = useNavigate();

      useEffect(() => {
        const checkUserAndProfile = async (currentSession: Session | null) => {
          if (currentSession) {
            const { data: profileData, error: profileError } = await supabase
              .from('perfiles')
              .select('perfil_completo, rol')
              .eq('id', currentSession.user.id)
              .single();

            if (profileError && profileError.code !== 'PGRST116') {
              console.error("Error fetching profile for redirection:", profileError);
              setProfileComplete(false);
            } else if (profileData) {
              setProfileComplete(profileData.perfil_completo);
              if (!profileData.perfil_completo) {
                navigate('/configurar-perfil');
              } else {
                if (window.location.pathname === '/login' || window.location.pathname === '/') {
                  navigate('/dashboard');
                }
              }
            } else {
              setProfileComplete(false);
              navigate('/configurar-perfil');
            }
          } else {
            setProfileComplete(null);
            navigate('/login');
          }
          setLoading(false);
        };

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, currentSession) => {
          setSession(currentSession);
          if (_event === 'SIGNED_IN' || _event === 'INITIAL_SESSION') {
            checkUserAndProfile(currentSession);
          } else if (_event === 'SIGNED_OUT') {
            setProfileComplete(null);
            navigate('/login');
            setLoading(false);
          }
        });

        supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
          setSession(initialSession);
          checkUserAndProfile(initialSession);
        });

        return () => subscription.unsubscribe();
      }, [navigate]);

      if (loading) {
        return (
          <div className="min-h-screen flex items-center justify-center bg-gray-100">
            <p className="text-xl text-gray-600">Cargando aplicación...</p>
          </div>
        );
      }

      return (
        <EstablishmentProvider session={session}>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/configurar-perfil" element={<ProfileSetup />} />

            {session && profileComplete ? (
              <Route path="/dashboard" element={<Dashboard />}>
                <Route index element={<DashboardIndex />} />
                {/* Teacher & Student Routes */}
                <Route path="cursos" element={<CoursesPage />} />
                <Route path="cursos/:cursoAsignaturaId" element={<CourseDetailPage />} />
                <Route path="estudiante/:studentId" element={<StudentDetailPage />} />
                <Route path="evaluacion" element={<EvaluationPage />} />
                <Route path="evaluacion/:evaluationId/responder" element={<EvaluationTakerPage />} />
                <Route path="proyectos" element={<ProjectsPage />} />
                <Route path="proyectos/:projectId" element={<ProjectDetailPage />} />
                <Route path="configuracion" element={<SettingsPage />} />

                {/* Teacher-only Routes */}
                <Route path="horario" element={<SchedulePage />} />
                <Route path="planificacion" element={<DidacticPlannerPage />} />
                <Route path="planificacion/nueva" element={<NewUnitPlan />} />
                <Route path="planificacion/editar/:planId" element={<EditUnitPlanPage />} />
                <Route path="planificacion/:planId" element={<UnitPlanDetailPage />} />
                <Route path="evaluacion/crear" element={<EvaluationBuilderPage />} />
                <Route path="evaluacion/editar/:evaluationId" element={<EvaluationBuilderPage />} />
                <Route path="evaluacion/:evaluationId" element={<EvaluationDetailPage />} />
                <Route path="evaluacion/:evaluationId/resultados" element={<EvaluationResultsPage />} />
                <Route path="evaluacion/:evaluationId/resultados/:responseId" element={<StudentResponseDetailPage />} />
                <Route path="evaluacion/:evaluationId/corregir" element={<EvaluationScannerPage />} />
                <Route path="rubricas" element={<RubricsPage />} />
                <Route path="rubricas/crear" element={<RubricBuilderPage />} />
                <Route path="rubricas/editar/:rubricId" element={<EditRubricPage />} />
                <Route path="rubricas/:rubricId" element={<RubricDetailPage />} />
                <Route path="analiticas" element={<AnalyticsPage />} />
                <Route path="informes" element={<ReportsPage />} />
                <Route path="informes/generar" element={<GenerateReportPage />} />
                <Route path="informes/:reportId" element={<ViewReportPage />} />
                <Route path="bitacora" element={<BitacoraPage />} />
                
                {/* Student-only Routes */}
                <Route path="mi-horario" element={<StudentSchedulePage />} />
                <Route path="mi-progreso" element={<MyProgressPage />} />

                {/* Admin Routes */}
                <Route path="gestion/cursos" element={<ManageCoursesPage />} />
                <Route path="gestion/calendario" element={<ManageCalendarPage />} />
                <Route path="gestion/diseno" element={<DesignManagementPage />} />
                <Route path="generador-experto" element={<ExpertGeneratorPage />} />
              </Route>
            ) : (
              <Route path="*" element={<Login />} />
            )}
            
            <Route path="/" element={<Index />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </EstablishmentProvider>
      );
    };

    const App = () => (
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <DesignProvider>
              <AppContent />
            </DesignProvider>
          </BrowserRouter>
        </TooltipProvider>
      </QueryClientProvider>
    );

    export default App;