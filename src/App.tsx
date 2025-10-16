import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { lazy, Suspense } from "react";
import { ThemeProvider } from "@/components/theme-provider";
import { EstablishmentProvider } from "./contexts/EstablishmentContext";
import { DesignProvider } from "./contexts/DesignContext";
import { AuthProvider } from "./contexts/AuthContext";
import FullPageLoader from "./components/layout/FullPageLoader";
import ProtectedRoute from "./components/auth/ProtectedRoute";

// Lazy load all page components
const LandingPage = lazy(() => import("./pages/LandingPage"));
const AppStart = lazy(() => import("./pages/AppStart"));
const Login = lazy(() => import("./pages/Login"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const CoursesPage = lazy(() => import("./pages/dashboard/CoursesPage"));
const SchedulePage = lazy(() => import("./pages/dashboard/SchedulePage"));
const DidacticPlannerPage = lazy(() => import("./pages/dashboard/DidacticPlannerPage"));
const NewUnitPlan = lazy(() => import("./pages/dashboard/planning/NewUnitPlan"));
const EditUnitPlanPage = lazy(() => import("./pages/dashboard/planning/EditUnitPlanPage"));
const UnitPlanDetailPage = lazy(() => import("./pages/dashboard/planning/UnitPlanDetailPage"));
const EvaluationPage = lazy(() => import("./pages/dashboard/evaluations/EvaluationPage"));
const EvaluationBuilderPage = lazy(() => import("./pages/dashboard/evaluations/EvaluationBuilderPage"));
const EvaluationDetailPage = lazy(() => import("./pages/dashboard/evaluations/EvaluationDetailPage"));
const EvaluationResultsPage = lazy(() => import("./pages/dashboard/evaluations/EvaluationResultsPage"));
const EvaluationTakerPage = lazy(() => import("./pages/dashboard/evaluations/EvaluationTakerPage"));
const EvaluationScannerPage = lazy(() => import("./pages/dashboard/evaluations/EvaluationScannerPage"));
const AdaptPIEPage = lazy(() => import("./pages/dashboard/evaluations/AdaptPIEPage"));
const ProjectsPage = lazy(() => import("./pages/dashboard/ProjectsPage"));
const ProjectDetailPage = lazy(() => import("./pages/dashboard/ProjectDetailPage"));
const SettingsPage = lazy(() => import("./pages/dashboard/SettingsPage"));
const CourseDetailPage = lazy(() => import("./pages/dashboard/CourseDetailPage"));
const StudentDetailPage = lazy(() => import("./pages/dashboard/StudentDetailPage"));
const ProfileSetup = lazy(() => import("./pages/ProfileSetup"));
const NotFound = lazy(() => import("./pages/NotFound"));
const BitacoraPage = lazy(() => import("./pages/dashboard/BitacoraPage"));
const RubricsPage = lazy(() => import("./pages/dashboard/RubricsPage"));
const RubricBuilderPage = lazy(() => import("./pages/dashboard/rubrics/RubricBuilderPage"));
const EditRubricPage = lazy(() => import("./pages/dashboard/rubrics/EditRubricPage"));
const RubricDetailPage = lazy(() => import("./pages/dashboard/rubrics/RubricDetailPage"));
const EvaluateRubricPage = lazy(() => import("./pages/dashboard/rubrics/EvaluateRubricPage"));
const AnalyticsPage = lazy(() => import("./pages/dashboard/AnalyticsPage"));
const StudentResponseDetailPage = lazy(() => import("./pages/dashboard/evaluations/StudentResponseDetailPage"));
const DashboardIndex = lazy(() => import("./pages/dashboard/DashboardIndex"));
const ManageCoursesPage = lazy(() => import("./pages/dashboard/admin/ManageCoursesPage"));
const ManageCalendarPage = lazy(() => import("./pages/dashboard/admin/ManageCalendarPage"));
const DesignManagementPage = lazy(() => import("./pages/dashboard/admin/DesignManagementPage"));
const StudentSchedulePage = lazy(() => import("./pages/dashboard/student/StudentSchedulePage"));
const MyProgressPage = lazy(() => import("./pages/dashboard/student/MyProgressPage"));
const ReportsPage = lazy(() => import("./pages/dashboard/reports/ReportsPage"));
const GenerateReportPage = lazy(() => import("./pages/dashboard/reports/GenerateReportPage"));
const ViewReportPage = lazy(() => import("./pages/dashboard/reports/ViewReportPage"));
const ExpertGeneratorPage = lazy(() => import("./pages/dashboard/super-admin/ExpertGeneratorPage"));
const SuccessPage = lazy(() => import("./pages/dashboard/payment/SuccessPage"));
const FailurePage = lazy(() => import("./pages/dashboard/payment/FailurePage"));
const PendingPage = lazy(() => import("./pages/dashboard/payment/PendingPage"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
    },
  },
});

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AuthProvider>
              <DesignProvider>
                <EstablishmentProvider>
                  <Suspense fallback={<FullPageLoader />}>
                    <Routes>
                      <Route path="/" element={<LandingPage />} />
                      <Route path="/start" element={<AppStart />} />
                      <Route path="/login" element={<Login />} />
                      <Route path="/configurar-perfil" element={<ProfileSetup />} />
                      
                      <Route element={<ProtectedRoute />}>
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
                          <Route path="evaluacion/adaptar/:evaluationId" element={<AdaptPIEPage />} />
                          <Route path="rubricas" element={<RubricsPage />} />
                          <Route path="rubricas/crear" element={<RubricBuilderPage />} />
                          <Route path="rubricas/editar/:rubricId" element={<EditRubricPage />} />
                          <Route path="rubricas/:rubricId" element={<RubricDetailPage />} />
                          <Route path="rubricas/evaluar" element={<EvaluateRubricPage />} />
                          <Route path="rubricas/evaluar/:rubricId" element={<EvaluateRubricPage />} />
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
                          <Route path="payment/success" element={<SuccessPage />} />
                          <Route path="payment/failure" element={<FailurePage />} />
                          <Route path="payment/pending" element={<PendingPage />} />
                        </Route>
                      </Route>

                      <Route path="*" element={<NotFound />} />
                    </Routes>
                  </Suspense>
                </EstablishmentProvider>
              </DesignProvider>
            </AuthProvider>
          </BrowserRouter>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;