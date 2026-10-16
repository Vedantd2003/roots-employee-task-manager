import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Pencil, Calendar, Mail, Phone, Briefcase, Tag } from 'lucide-react';
import { format } from 'date-fns';
import { useEmployee } from '../../hooks/useEmployees';
import { PageHeader } from '../../components/layout/PageHeader';
import { Button } from '../../components/ui/Button';
import { EmployeeStatusBadge } from '../../components/ui/Badge';
import { PageLoader } from '../../components/ui/LoadingSpinner';

function DetailRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 py-3 border-b border-gray-50 last:border-0">
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center mt-0.5">
        <Icon className="h-4 w-4 text-gray-500" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">{label}</p>
        <div className="mt-0.5 text-sm text-gray-900">{value}</div>
      </div>
    </div>
  );
}

export function EmployeeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: employee, isLoading } = useEmployee(id!);

  if (isLoading) return <PageLoader />;

  if (!employee) {
    return <div className="text-center py-12 text-gray-500">Employee not found.</div>;
  }

  const formatDate = (d?: string) => {
    if (!d) return '—';
    try {
      return format(new Date(d), 'MMM d, yyyy');
    } catch {
      return d;
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={employee.fullName}
        subtitle={`${employee.role} · ${employee.department}`}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate('/employees')}>
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <Button onClick={() => navigate(`/employees/${id}/edit`)}>
              <Pencil className="h-4 w-4" />
              Edit
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Basic Info */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-gray-900">Employee Information</h3>
            <EmployeeStatusBadge status={employee.status} />
          </div>
          <div>
            <DetailRow icon={Tag} label="Employee ID" value={<span className="font-mono">{employee.employeeId}</span>} />
            <DetailRow icon={Mail} label="Email" value={employee.email} />
            <DetailRow icon={Phone} label="Phone" value={employee.phone} />
            <DetailRow icon={Briefcase} label="Department" value={employee.department} />
            <DetailRow icon={Briefcase} label="Role" value={employee.role} />
            <DetailRow icon={Calendar} label="Joining Date" value={formatDate(employee.joiningDate)} />
            <DetailRow
              icon={Tag}
              label="Active Tasks"
              value={
                <span className={`font-semibold ${employee.activeTasks > 0 ? 'text-brand-dark' : 'text-gray-400'}`}>
                  {employee.activeTasks}
                </span>
              }
            />
          </div>
        </div>

        {/* Skills + Leave */}
        <div className="space-y-4">
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
            <h3 className="text-base font-semibold text-gray-900 mb-4">Skills</h3>
            {employee.skills && employee.skills.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {employee.skills.map((skill) => (
                  <span
                    key={skill}
                    className="px-2.5 py-1 bg-brand/10 text-brand-dark rounded-full text-xs font-medium border border-brand/20"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400">No skills listed</p>
            )}
          </div>

          {employee.status === 'On Leave' && (
            <div className="bg-yellow-50 rounded-lg border border-yellow-200 p-6">
              <h3 className="text-base font-semibold text-yellow-800 mb-3">
                <Calendar className="h-4 w-4 inline mr-2" />
                Leave Period
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-yellow-700">From:</span>
                  <span className="font-medium text-yellow-900">{formatDate(employee.leaveStartDate)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-yellow-700">To:</span>
                  <span className="font-medium text-yellow-900">{formatDate(employee.leaveEndDate)}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
