import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { FiUploadCloud, FiX, FiMapPin, FiArrowLeft, FiArrowRight, FiCheck } from 'react-icons/fi';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { issuesAPI } from '../../api/issuesAPI';

const STEPS = ['Details', 'Location', 'Photos', 'Review'];

export default function ReportIssuePage() {
  const navigate = useNavigate();
  const fileRef  = useRef(null);

  const [step,     setStep]     = useState(0);
  const [loading,  setLoading]  = useState(false);
  const [cats,     setCats]     = useState([]);
  const [previews, setPreviews] = useState([]);
  const [files,    setFiles]    = useState([]);
  const [errors,   setErrors]   = useState({});

  const [form, setForm] = useState({
    title: '', description: '', category_id: '', priority: 'medium',
    location: '', latitude: '', longitude: '',
  });

  useEffect(() => {
    issuesAPI.getCategories().then((r) => setCats(r.data || [])).catch(() => {});
  }, []);

  const set = (k, v) => {
    setForm((p) => ({ ...p, [k]: v }));
    if (errors[k]) setErrors((p) => ({ ...p, [k]: '' }));
  };

  const validateStep = () => {
    const e = {};
    if (step === 0) {
      if (!form.title.trim())       e.title       = 'Title is required';
      if (!form.description.trim()) e.description = 'Description is required';
    }
    setErrors(e);
    return !Object.keys(e).length;
  };

  const next = () => { if (validateStep()) setStep((s) => s + 1); };
  const prev = () => setStep((s) => s - 1);

  const handleFiles = (e) => {
    const selected = Array.from(e.target.files).slice(0, 5 - files.length);
    const newFiles = [...files, ...selected].slice(0, 5);
    setFiles(newFiles);
    setPreviews(newFiles.map((f) => URL.createObjectURL(f)));
  };

  const removeImage = (i) => {
    const nf = files.filter((_, idx) => idx !== i);
    const np = previews.filter((_, idx) => idx !== i);
    setFiles(nf);
    setPreviews(np);
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => { if (v) fd.append(k, v); });
      files.forEach((f) => fd.append('images', f));
      const res = await issuesAPI.create(fd);
      toast.success('Issue reported successfully!');
      navigate(`/citizen/issues/${res.data.issue.id}`);
    } catch (err) {
      toast.error(err.message || 'Failed to submit issue');
    } finally {
      setLoading(false);
    }
  };

  const tryGPS = () => {
    if (!navigator.geolocation) { toast.error('Geolocation not supported'); return; }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        set('latitude',  pos.coords.latitude.toFixed(6));
        set('longitude', pos.coords.longitude.toFixed(6));
        toast.success('Location captured!');
      },
      () => toast.error('Could not get location')
    );
  };

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="page-title">Report an Issue</h1>
          <p className="page-subtitle">Help us improve your city by reporting civic problems</p>
        </div>

        {/* Stepper */}
        <div className="flex items-center mb-8">
          {STEPS.map((s, i) => (
            <div key={s} className="flex-1 flex items-center">
              <div className={`flex items-center gap-2 ${i <= step ? 'text-primary-600' : 'text-gray-400'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold border-2 transition-all
                  ${i < step ? 'bg-primary-600 border-primary-600 text-white' :
                    i === step ? 'border-primary-600 text-primary-600 bg-primary-50' :
                    'border-gray-200 text-gray-400'}`}>
                  {i < step ? <FiCheck className="w-4 h-4" /> : i + 1}
                </div>
                <span className="hidden sm:block text-xs font-medium">{s}</span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={`flex-1 h-0.5 mx-2 rounded ${i < step ? 'bg-primary-600' : 'bg-gray-200'}`} />
              )}
            </div>
          ))}
        </div>

        <div className="card">
          <div className="card-body !p-8">
            {/* Step 0: Details */}
            {step === 0 && (
              <div className="space-y-5">
                <div className="form-group">
                  <label className="form-label" htmlFor="issue-title">Issue Title *</label>
                  <input id="issue-title" type="text" value={form.title} onChange={(e) => set('title', e.target.value)}
                    className={`form-input ${errors.title ? 'border-red-400' : ''}`}
                    placeholder="e.g. Large pothole on MG Road" />
                  {errors.title && <span className="form-error">{errors.title}</span>}
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="issue-desc">Description *</label>
                  <textarea id="issue-desc" rows={4} value={form.description} onChange={(e) => set('description', e.target.value)}
                    className={`form-textarea ${errors.description ? 'border-red-400' : ''}`}
                    placeholder="Describe the issue in detail — size, severity, any hazards..." />
                  {errors.description && <span className="form-error">{errors.description}</span>}
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="form-group">
                    <label className="form-label" htmlFor="issue-cat">Category</label>
                    <select id="issue-cat" value={form.category_id} onChange={(e) => set('category_id', e.target.value)} className="form-select">
                      <option value="">Select category</option>
                      {cats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="issue-priority">Priority</label>
                    <select id="issue-priority" value={form.priority} onChange={(e) => set('priority', e.target.value)} className="form-select">
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="critical">Critical</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Step 1: Location */}
            {step === 1 && (
              <div className="space-y-5">
                <div className="form-group">
                  <label className="form-label" htmlFor="issue-loc">Location / Address</label>
                  <div className="relative">
                    <FiMapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input id="issue-loc" type="text" value={form.location} onChange={(e) => set('location', e.target.value)}
                      className="form-input pl-9"
                      placeholder="e.g. MG Road near bus stop, Bengaluru" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="form-group">
                    <label className="form-label" htmlFor="issue-lat">Latitude</label>
                    <input id="issue-lat" type="number" step="any" value={form.latitude} onChange={(e) => set('latitude', e.target.value)}
                      className="form-input" placeholder="12.9716" />
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="issue-lng">Longitude</label>
                    <input id="issue-lng" type="number" step="any" value={form.longitude} onChange={(e) => set('longitude', e.target.value)}
                      className="form-input" placeholder="77.5946" />
                  </div>
                </div>

                <button type="button" onClick={tryGPS} className="btn-outline w-full gap-2">
                  <FiMapPin className="w-4 h-4" /> Use My Current Location (GPS)
                </button>
                <p className="form-hint text-center">Location is optional but helps officers reach the site faster</p>
              </div>
            )}

            {/* Step 2: Photos */}
            {step === 2 && (
              <div className="space-y-5">
                <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={handleFiles} />
                <div
                  onClick={() => fileRef.current?.click()}
                  className="border-2 border-dashed border-gray-300 rounded-xl p-10 text-center cursor-pointer hover:border-primary-400 hover:bg-primary-50 transition-colors"
                >
                  <FiUploadCloud className="w-10 h-10 text-gray-400 mx-auto mb-3" />
                  <p className="text-sm font-medium text-gray-700">Click to upload photos</p>
                  <p className="text-xs text-gray-400 mt-1">JPEG, PNG, WebP · Max 5 images · 5 MB each</p>
                </div>

                {previews.length > 0 && (
                  <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
                    {previews.map((src, i) => (
                      <div key={i} className="relative group aspect-square">
                        <img src={src} alt="" className="w-full h-full object-cover rounded-lg border border-gray-200" />
                        <button
                          onClick={() => removeImage(i)}
                          className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <FiX className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <p className="form-hint">{5 - files.length} more photo{files.length !== 4 ? 's' : ''} can be added</p>
              </div>
            )}

            {/* Step 3: Review */}
            {step === 3 && (
              <div className="space-y-4">
                <h3 className="section-title">Review your report</h3>
                <div className="bg-gray-50 rounded-xl p-5 space-y-3">
                  <Row label="Title"       value={form.title} />
                  <Row label="Description" value={form.description} />
                  <Row label="Category"    value={cats.find((c) => String(c.id) === String(form.category_id))?.name || '—'} />
                  <Row label="Priority"    value={<span className="capitalize">{form.priority}</span>} />
                  <Row label="Location"    value={form.location || '—'} />
                  {form.latitude && <Row label="Coords" value={`${form.latitude}, ${form.longitude}`} />}
                  <Row label="Photos"      value={`${files.length} attached`} />
                </div>
                {previews.length > 0 && (
                  <div className="flex gap-2 flex-wrap">
                    {previews.map((src, i) => (
                      <img key={i} src={src} alt="" className="w-16 h-16 object-cover rounded-lg border border-gray-200" />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Navigation */}
            <div className="flex justify-between mt-8 pt-6 border-t border-gray-100">
              {step > 0
                ? <button onClick={prev} className="btn-outline gap-2"><FiArrowLeft className="w-4 h-4" /> Back</button>
                : <div />}
              {step < STEPS.length - 1
                ? <button onClick={next} className="btn-primary gap-2">Next <FiArrowRight className="w-4 h-4" /></button>
                : <button onClick={handleSubmit} className="btn-success gap-2" disabled={loading}>
                    <FiCheck className="w-4 h-4" />
                    {loading ? 'Submitting…' : 'Submit Report'}
                  </button>}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

const Row = ({ label, value }) => (
  <div className="flex gap-3 text-sm">
    <span className="text-gray-500 w-24 shrink-0">{label}</span>
    <span className="text-gray-900 font-medium flex-1">{value}</span>
  </div>
);
