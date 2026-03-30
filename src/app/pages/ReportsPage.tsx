import { useEffect, useState } from "react";
import { Plus, FileText } from "lucide-react";
import { Button } from "../components/ui/button";
import { DataTable, Column } from "../components/DataTable";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../components/ui/dialog";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { toast } from "sonner";
import { reportService } from "@/services/reportService";

interface Report {
  id: number;
  name: string;
  project: string;
  createdBy: string;
  createdAt: string;
  type: "summary" | "detailed" | "analytics";
}

type ApiReport = {
  report_id: number;
  project_id?: number;
  generated_at?: string;
  content?: string;
};

const projects = [
  "E-commerce Platform",
  "Mobile App Redesign",
  "Customer Portal",
  "API Documentation",
];

export function ReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isGenerateOpen, setIsGenerateOpen] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    project: "",
    type: "summary" as Report["type"],
  });

  const [generateProject, setGenerateProject] = useState("");

  useEffect(() => {
    reportService
      .getAll()
      .then((response: { data: { data: any[] } }) => {
        const apiReports = response.data.data || [];
        setReports(apiReports.map((report) => ({
          id: report.report_id,
          name: report.content || `Report ${report.report_id}`,
          project: report.project_id ? `Project ${report.project_id}` : "",
          createdBy: "System",
          createdAt: report.generated_at ? report.generated_at.split("T")[0] : "",
          type: "summary",
        })));
      })
      .catch((error: any) => {
        console.error("Failed to fetch reports", error);
        toast.error("Failed to load reports");
      });
  }, []);

  const handleCreate = () => {
    setFormData({ name: "", project: "", type: "summary" });
    setIsCreateOpen(true);
  };

  const handleSubmit = () => {
    const payload = {
      project_id: Number(formData.project.replace(/[^0-9]/g, "")) || undefined,
      content: formData.name,
    };

    reportService
      .create(payload)
      .then((response: { data: { data: any } }) => {
        const created = response.data.data;
        const newReport: Report = {
          id: created.report_id,
          name: formData.name,
          project: formData.project,
          createdBy: "Current User",
          createdAt: created.generated_at ? created.generated_at.split("T")[0] : new Date().toISOString().split("T")[0],
          type: formData.type,
        };
        setReports([...reports, newReport]);
        toast.success("Report created successfully");
        setIsCreateOpen(false);
      })
      .catch((error: any) => {
        console.error("Failed to create report", error);
        toast.error("Failed to create report");
      });
  };

  const handleGenerate = () => {
    if (!generateProject) {
      toast.error("Please select a project");
      return;
    }

    const projectId = Number(generateProject.replace(/[^0-9]/g, "")) || undefined;
    if (!projectId) {
      toast.error("Invalid project selected");
      return;
    }

    reportService
      .generateProjectReport(projectId)
      .then((response: { data: { data: any } }) => {
        const created = response.data.data;
        const newReport: Report = {
          id: created.report_id,
          name: `Generated Report - ${generateProject}`,
          project: generateProject,
          createdBy: "Current User",
          createdAt: created.generated_at ? created.generated_at.split("T")[0] : new Date().toISOString().split("T")[0],
          type: "detailed",
        };
        setReports([...reports, newReport]);
        toast.success("Report generated successfully");
        setIsGenerateOpen(false);
        setGenerateProject("");
      })
      .catch((error: any) => {
        console.error("Failed to generate report", error);
        toast.error("Failed to generate report");
      });
  };

  const handleDelete = (report: Report) => {
    setDeleteId(report.id);
  };

  const confirmDelete = () => {
    if (deleteId) {
      reportService
        .delete(deleteId)
        .then(() => {
          setReports(reports.filter((r) => r.id !== deleteId));
          toast.success("Report deleted successfully");
          setDeleteId(null);
        })
        .catch((error: any) => {
          console.error("Failed to delete report", error);
          toast.error("Failed to delete report");
        });
    }
  };

  const columns: Column<Report>[] = [
    { key: "id", label: "ID" },
    { key: "name", label: "Name" },
    { key: "project", label: "Project" },
    { key: "createdBy", label: "Created By" },
    { key: "createdAt", label: "Date" },
    { key: "type", label: "Type" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900">Reports</h1>
          <p className="text-gray-600 mt-1">View and generate project reports</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setIsGenerateOpen(true)}>
            <FileText className="h-4 w-4 mr-2" />
            Generate Report
          </Button>
          <Button onClick={handleCreate}>
            <Plus className="h-4 w-4 mr-2" />
            Create Report
          </Button>
        </div>
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        data={reports}
        onDelete={handleDelete}
        getRowId={(item) => item.id}
      />

      {/* Create Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Report</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="name">Report Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter report name"
              />
            </div>
            <div>
              <Label htmlFor="project">Project</Label>
              <Select
                value={formData.project}
                onValueChange={(value) => setFormData({ ...formData, project: value })}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select project" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((project) => (
                    <SelectItem key={project} value={project}>
                      {project}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="type">Report Type</Label>
              <Select
                value={formData.type}
                onValueChange={(value) =>
                  setFormData({ ...formData, type: value as Report["type"] })
                }
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="summary">Summary</SelectItem>
                  <SelectItem value="detailed">Detailed</SelectItem>
                  <SelectItem value="analytics">Analytics</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Generate Dialog */}
      <Dialog open={isGenerateOpen} onOpenChange={setIsGenerateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Generate Report</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="generateProject">Select Project</Label>
              <Select value={generateProject} onValueChange={setGenerateProject}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select project" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((project) => (
                    <SelectItem key={project} value={project}>
                      {project}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <p className="text-sm text-gray-600">
              This will automatically generate a detailed report for the selected project
              including tasks, progress, and team performance.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsGenerateOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleGenerate}>Generate</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={deleteId !== null}
        onOpenChange={(open) => !open && setDeleteId(null)}
        onConfirm={confirmDelete}
        title="Delete Report"
        description="Are you sure you want to delete this report? This action cannot be undone."
      />
    </div>
  );
}
