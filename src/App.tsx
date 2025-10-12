import { Toaster } from "@/components/ui/toaster";
    import { Toaster as Sonner } from "@/components/ui/sonner";
    import { TooltipProvider } from "@/components/ui/tooltip";
    import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
    import { BrowserRouter, Routes, Route } from "react-router-dom";
    import { useState, useEffect } from "react";
    import { Session } from "@supabase/supabase-js";
    import { supabase } from "@/integrations/supabase/client";
    import { ThemeProvider } from "@/components/theme-provider";
    import LandingPage from "./pages/LandingPage";
    import AppStart from "./pages/AppStart";
    import Login from "./pages/Login";
    import Dashboard from "./pages/Dashboard"; 
    import CoursesPage from "./pages/dashboard/CoursesPage";
    import SchedulePage from "./pages/dashboard/SchedulePage";
    import DidacticPlannerPage from "./pages/dashboard/DidacticPlannerPage";
    import NewUnitPlan from "./pages/dashboard/planning/NewUnitPlan";
    import EditUnitPlanPage from "./pages/dashboard/planning/EditUnitPlanPage";
    import UnitPlanDetailPage from "./pages/dashboard/planning/UnitPlanDetailPage";
    import EvaluationPage from "./pages/dashboard/evaluations/EvaluationPage";
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

    const App = () => {
      const [session, setSession] = useState<Session | null>(null);
      const [loading, setLoading] = useState(true);

      useEffect(() => {
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
          setSession(session);
        });
        
        supabase.auth.getSession().then(({ data: { session } }) => {
          setSession(session);
          setLoading(false);
        });

        return () => subscription.unsubscribe();
      }, []);

      if (loading) {
        return (
          <div className="min-h-screen flex items-center justify-center bg-gray-100">
            <p className="text-xl text-gray-600">Cargando aplicación...</p>
          </div>
        );
      }

      return (
        <QueryClientProvider client={queryClient}>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <BrowserRouter>
                <DesignProvider>
                  <EstablishmentProvider session={session}>
                    <Routes>
                      <Route path="/" element={<LandingPage />} />
                      <Route path="/start" element={<AppStart />} />
                      <Route path="/login" element={<Login />} />
                      <Route path="/configurar-perfil" element={<ProfileSetup />} />
                      <Route path="/dashboard" element={<Dashboard />}>
                        <Route index element={<DashboardIndex />} />
                        <Route path="cursos" element={<CoursesPage />} />
                        <Route path="cursos/:cursoAsignaturaId" element={<CourseDetailPage />} />
                        <Route path="estudiante/:studentId" element={<StudentDetailPage />} />
                        <Route path="evaluacion" element={<EvaluationPage />} />
                        <Route path="evaluacion/:evaluationId/responder" element={<EvaluationTakerPage />} />
                        <Route path="proyectos" element={<ProjectsPage />} />
                        <Route path="proyectos/:projectId" element={<ProjectDetailPage />} />
                        <Route path="configuracion" element={<SettingsPage />} />
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
                        <Route path="mi-horario" element={<StudentSchedulePage />} />
                        <Route path="mi-progreso" element={<MyProgressPage />} />
                        <Route path="gestion/cursos" element={<ManageCoursesPage />} />
                        <Route path="gestion/calendario" element={<ManageCalendarPage />} />
                        <Route path="gestion/diseno" element={<DesignManagementPage />} />
                        <Route path="generador-experto" element={<ExpertGeneratorPage />} />
                      </Route>
                      <Route path="*" element={<NotFound />} />
                    </Routes>
                  </EstablishmentProvider>
                </DesignProvider>
              </BrowserRouter>
            </TooltipProvider>
          </ThemeProvider>
        </QueryClientProvider>
      );
    };

    export default App;