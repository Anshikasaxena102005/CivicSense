import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { FiArrowLeft, FiUploadCloud, FiX, FiSave } from 'react-icons/fi';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { StatusBadge, PriorityBadge } from '../../components/shared/Badges';
import { ImageGallery } from '../../components/shared/ImageGallery';
import { LoadingSpinner } from '../../components/shared/LoadingSpinner';
import { issuesAPI } from '../../api/issuesAPI';

const timelineIcons = {
  'Issue Created':         '📝',
  'Officer Assigned':      '👮',
  'Status Changed':        '🔄',
  'Issue Resolved':        '✅',
  'Issue Rejected':        '❌',
  'Issue Reopened':        '🔓',
  'Resolution Note Added': '📋',
  'After-image Uploaded':  '📸',
};

export default function IssueUpdatePage() {
  const { id }    = useParams();
  const navigate  = useNavigate();
  const fileRef   = useRef(null);

  const [data,        setData]        = useState(null);
  const [loading,     setLoading]     = useState(true);
  const [saving,      setSaving]      = useState(false);
  const [uploading,   setUploading]   = useState(false);
  const [savingNote,  setSavingNote]  = useState(false);
  const [newStatus,   setNewStatus]   = useState('');
  const [note,        setNote]        = useState('');
  const [rejReason,   setRejReason]   = useState('');
  const [resNote,     setResNote]     = useState('');
  const [afterPreviews, setAfterPreviews] = useState([]);
  const [afterFiles,    setAfterFiles]   = useState([]);

  const load = async () => {
    try {
      const res = await issuesAPI.getAssignedIssue(id);
      setData(res.data);
      setNote(res.data.issue.resolution_note || '');
    } catch { toast.error('Issue not found'); navigate('/officer/issues'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [id]);

  const handleStatusUpdate = async () => {
    if (!newStatus) { toast.error('Select a status first'); return; }
    if (newStatus === 'rejected' && !rejReason.trim()) { toast.error('Rejection reason is required'); return; }
    setSaving(true);
    try {
      await issuesAPI.updateStatus(id, {
        status: newStatus,
        note: note || undefined,
        rejection_reason: rejReason || undefined,
      });
      toast.success('Status updated!');
      await load();
      setNewStatus('');
    } catch (err) { toast.error(err.message || 'Failed to update'); }
    finally { setSaving(false); }
  };

  const handleSaveNote = async () => {
    if (!resNote.trim()) { toast.error('Note cannot be empty'); return; }
    setSavingNote(true);
    try {
      await issuesAPI.addResolution(id, { note: resNote });
      toast.success('Resolution note saved');
      await load();
      setResNote('');
    } catch (err) { toast.error(err.message || 'Failed to save note'); }
    finally { setSavingNote(false); }
  };

  const handleFileSelect = (e) => {
    const selected = Array.from(e.target.files).slice(0, 5);
    setAfterFiles(selected);
    setAfterPreviews(selected.map((f) => URL.createObjectURL(f)));
  };

  const handleAfterUpload = async () => {
    if (!afterFiles.length) { toast.error('Select images first'); return; }
    setUploading(true);
    try {
      const fd = new FormData();
      afterFiles.forEach((f) => fd.append('images', f));
      await issuesAPI.uploadAfterImages(id, fd);
      toast.success('After-images uploaded!');
      setAfterFiles([]);
      setAfterPreviews([]);
      await load();
    } catch (err) { toast.error(err.message || 'Upload failed'); }
    finally { setUploading(false); }
  };

  if (loading) return <DashboardLayout><LoadingSpinner className="mt-20" /></DashboardLayout>;
  if (!data)   return null;

  const { issue, timeline } = data;
  const canUpdate = ['assigned', 'in_progress', 'reopened'].includes(issue.status);

  const allowedStatuses = {
    assigned:    ['in_progress', 'resolved', 'rejected'],
    in_progress: ['resolved', 'rejected'],
    reopened:    ['in_progress', 'resolved', 'rejected'],
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <Link to="/officer/issues" className="btn-ghost gap-2 text-sm">
          <FiArrowLeft className="w-4 h-4" /> Back to Issues
        </Link>

        {/* Issue header */}
        <div className="card">
          <div className="card-header">
            <div className="min-w-0">
              <h1 className="text-xl font-bold text-gray-900 truncate">{issue.title}</h1>
              <p className="text-xs text-gray-400 mt-0.5">
                Reported by {issue.citizen_name} ({issue.citizen_email}) · {new Date(issue.created_at).toLocaleString()}
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <PriorityBadge priority={issue.priority} />
              <StatusBadge status={issue.status} />
            </div>
          </div>
          <div className="card-body space-y-5">
            <div>
              <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-1">Description</p>
              <p className="text-sm text-gray-700 leading-relaxed">{issue.description}</p>
            </div>
            {issue.location && (
              <div>
                <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-1">Location</p>
                <p className="text-sm text-gray-700">{issue.location}</p>
              </div>
            )}
            {issue.images?.length > 0 && (
              <div>
                <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-2">Issue Photos</p>
                <ImageGallery images={issue.images} />
              </div>
            )}
            {issue.citizen_phone && (
              <div>
                <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-1">Citizen Phone</p>
                <p className="text-sm text-gray-700">{issue.citizen_phone}</p>
              </div>
            )}
          </div>
        </div>

        {/* Update Status */}
        {canUpdate && (
          <div className="card">
            <div className="card-header">
              <h2 className="section-title">Update Status</h2>
            </div>
            <div className="card-body space-y-4">
              <div className="form-group">
                <label className="form-label">New Status</label>
                <select value={newStatus} onChange={(e) => setNewStatus(e.target.value)} className="form-select max-w-xs">
                  <option value="">Select new status…</option>
                  {(allowedStatuses[issue.status] || []).map((s) => (
                    <option key={s} value={s}>{s.replace('_', ' ')}</option>
                  ))}
                </select>
              </div>

              {newStatus === 'resolved' && (
                <div className="form-group">
                  <label className="form-label">Resolution Note (optional)</label>
                  <textarea rows={3} value={note} onChange={(e) => setNote(e.target.value)}
                    className="form-textarea" placeholder="Describe what was done to resolve this issue…" />
                </div>
              )}

              {newStatus === 'rejected' && (
                <div className="form-group">
                  <label className="form-label">Rejection Reason *</label>
                  <textarea rows={3} value={rejReason} onChange={(e) => setRejReason(e.target.value)}
                    className="form-textarea" placeholder="Explain why this issue cannot be resolved…" />
                </div>
              )}

              <button onClick={handleStatusUpdate} className="btn-primary gap-2" disabled={saving}>
                <FiSave className="w-4 h-4" />
                {saving ? 'Saving…' : 'Update Status'}
              </button>
            </div>
          </div>
        )}

        {/* Add Resolution Note */}
        <div className="card">
          <div className="card-header">
            <h2 className="section-title">Resolution Note</h2>
          </div>
          <div className="card-body space-y-3">
            {issue.resolution_note && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-700">
                <strong>Current note:</strong> {issue.resolution_note}
              </div>
            )}
            <div className="form-group">
              <textarea rows={3} value={resNote} onChange={(e) => setResNote(e.target.value)}
                className="form-textarea" placeholder="Add or update resolution note…" />
            </div>
            <button onClick={handleSaveNote} className="btn-outline gap-2" disabled={savingNote}>
              <FiSave className="w-4 h-4" />
              {savingNote ? 'Saving…' : 'Save Note'}
            </button>
          </div>
        </div>

        {/* After Images */}
        <div className="card">
          <div className="card-header">
            <h2 className="section-title">After-Resolution Photos</h2>
          </div>
          <div className="card-body space-y-4">
            {issue.after_images?.length > 0 && (
              <div>
                <p className="text-xs text-gray-500 mb-2">Existing photos</p>
                <ImageGallery images={issue.after_images} />
              </div>
            )}
            <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={handleFileSelect} />
            <div onClick={() => fileRef.current?.click()}
              className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center cursor-pointer hover:border-primary-300 hover:bg-primary-50 transition-colors">
              <FiUploadCloud className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-600">Click to select after-resolution photos</p>
              <p className="text-xs text-gray-400 mt-1">Max 5 images · JPEG, PNG, WebP</p>
            </div>
            {afterPreviews.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {afterPreviews.map((src, i) => (
                  <div key={i} className="relative">
                    <img src={src} alt="" className="w-20 h-20 object-cover rounded-lg border border-gray-200" />
                    <button onClick={() => {
                      const nf = afterFiles.filter((_, j) => j !== i);
                      setAfterFiles(nf);
                      setAfterPreviews(nf.map((f) => URL.createObjectURL(f)));
                    }} className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center">
                      <FiX className="w-2.5 h-2.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            {afterPreviews.length > 0 && (
              <button onClick={handleAfterUpload} className="btn-success gap-2" disabled={uploading}>
                <FiUploadCloud className="w-4 h-4" />
                {uploading ? 'Uploading…' : 'Upload Photos'}
              </button>
            )}
          </div>
        </div>

        {/* Timeline */}
        {timeline?.length > 0 && (
          <div className="card">
            <div className="card-header"><h2 className="section-title">Issue Timeline</h2></div>
            <div className="card-body">
              <div className="space-y-4">
                {timeline.map((entry, i) => (
                  <div key={entry.id} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-base shrink-0">
                        {timelineIcons[entry.action] || '📌'}
                      </div>
                      {i < timeline.length - 1 && <div className="w-0.5 bg-gray-100 flex-1 mt-1" />}
                    </div>
                    <div className="pb-4 min-w-0">
                      <p className="text-sm font-medium text-gray-900">{entry.action}</p>
                      {entry.note && <p className="text-xs text-gray-500 mt-0.5">{entry.note}</p>}
                      <p className="text-xs text-gray-400 mt-1">
                        {entry.user_name ? `by ${entry.user_name}` : 'System'} · {new Date(entry.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
