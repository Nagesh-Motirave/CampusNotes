import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { uploadFile } from '../api/upload';
import { uploadNote, getDistinctValues } from '../api/notes';
import { useAuth } from '../context/AuthContext';
import CollegeAutocomplete from '../components/CollegeAutocomplete';

/**
 * Upload Notes Page — Protected route.
 * Two-step upload: 1) Upload file to Cloudinary, 2) Save note metadata.
 * Includes file picker, progress bar, and form validation.
 */
const UploadNote = () => {
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [step, setStep] = useState('form'); // 'form' | 'uploading' | 'success'
  const { isAdmin } = useAuth();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm();
  
  const selectedResourceType = watch('resourceType', '');
  const isSyllabus = selectedResourceType === 'Syllabus';

  const [options, setOptions] = useState({
    universities: ['SPPU', 'MSBTE'],
    branches: [],
    years: ['First Year', 'Second Year', 'Third Year', 'Fourth Year', 'Diploma'],
    semesters: ['1', '2', '3', '4', '5', '6', '7', '8'],
    resourceTypes: ['Notes', 'PYQs', 'Syllabus', 'Important Questions', 'Lab Manual', 'Books'],
    colleges: []
  });

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const unis = await getDistinctValues('university');
        const brs = await getDistinctValues('branch');
        const yrs = await getDistinctValues('year');
        const types = await getDistinctValues('resourceType');
        const cols = await getDistinctValues('college');

        setOptions(prev => ({
          ...prev,
          universities: unis.length ? Array.from(new Set([...prev.universities, ...unis])) : prev.universities,
          branches: brs.length ? brs : prev.branches,
          years: yrs.length ? Array.from(new Set([...prev.years, ...yrs])) : prev.years,
          resourceTypes: types.length ? Array.from(new Set([...prev.resourceTypes, ...types])) : prev.resourceTypes,
          colleges: cols.length ? cols : prev.colleges
        }));
      } catch (err) {
        console.error("Failed to load distinct values", err);
      }
    };
    fetchOptions();
  }, []);

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (!selected) return;

    // Validate file type
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];
    if (!allowedTypes.includes(selected.type)) {
      toast.error('Only PDF, JPEG, and PNG files are allowed');
      return;
    }

    // Validate file size (max 10MB)
    if (selected.size > 10 * 1024 * 1024) {
      toast.error('File size must be under 10MB');
      return;
    }

    setFile(selected);
  };

  const onSubmit = async (data) => {
    if (!file) {
      toast.error('Please select a file to upload');
      return;
    }

    setUploading(true);
    setStep('uploading');
    setUploadProgress(0);

    try {
      // Step 1: Upload file to Cloudinary
      const fileData = await uploadFile(file, (progress) => {
        setUploadProgress(progress);
      });

      // Step 2: Save note metadata
      const noteData = {
        ...data,
        subjectName: isSyllabus ? 'Syllabus' : data.subject, // Map subject to subjectName
        subject: isSyllabus ? 'Syllabus' : data.subject, // Map subject to subject for backend validation
        semester: isSyllabus ? 0 : parseInt(data.semester),
        fileUrl: fileData.fileUrl,
        fileType: fileData.fileType,
        isExamImportant: data.isExamImportant || false,
        // The backend fields map to these exactly.
      };

      const savedNote = await uploadNote(noteData);
      setStep('success');
      toast.success('Note uploaded successfully! +10 points 🎉');

      setTimeout(() => {
        navigate(`/notes/${savedNote._id || savedNote.id}`);
      }, 1500);
    } catch (err) {
      const msg = err.response?.data?.message || 'Upload failed. Please try again.';
      toast.error(msg);
      setStep('form');
    } finally {
      setUploading(false);
    }
  };

  /** Format file size */
  const formatFileSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl gradient-primary shadow-lg shadow-primary-500/30 mb-4">
          <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Upload Notes</h1>
        <p className="text-gray-500 mt-1">Share your notes and earn 10 points!</p>
      </div>

      {/* Upload Card */}
      <div className="glass-card p-8">
        {step === 'success' ? (
          /* Success state */
          <div className="text-center py-8 animate-fade-in">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center">
              <svg className="w-10 h-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Upload Successful!</h3>
            <p className="text-gray-500">Redirecting to your note...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Title / Description */}
            <div>
              <label htmlFor="upload-title" className="block text-sm font-medium text-gray-700 mb-1.5">
                Note Title *
              </label>
              <input
                id="upload-title"
                type="text"
                className={`input-field ${errors.title ? 'border-red-400' : ''}`}
                placeholder="e.g. Unit 1 Complete Notes"
                {...register('title', { required: 'Title is required' })}
              />
              {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title.message}</p>}
            </div>

            {/* Subject - Hide if Syllabus */}
            {!isSyllabus && (
              <div>
                <label htmlFor="upload-subject" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Subject *
                </label>
                <input
                  id="upload-subject"
                  type="text"
                  className={`input-field ${errors.subject ? 'border-red-400' : ''}`}
                  placeholder="e.g. Engineering Mathematics"
                  {...register('subject', { required: !isSyllabus ? 'Subject is required' : false })}
                />
                {errors.subject && <p className="text-red-500 text-xs mt-1">{errors.subject.message}</p>}
              </div>
            )}

            {/* University & Branch */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="upload-university" className="block text-sm font-medium text-gray-700 mb-1.5">
                  University / Board *
                </label>
                <input
                  id="upload-university"
                  list="universities-list"
                  className={`input-field ${errors.university ? 'border-red-400' : ''}`}
                  placeholder="Select or type University"
                  {...register('university', { required: 'University is required' })}
                />
                <datalist id="universities-list">
                  {options.universities.map(u => <option key={u} value={u} />)}
                </datalist>
                {errors.university && <p className="text-red-500 text-xs mt-1">{errors.university.message}</p>}
              </div>
              <div>
                <label htmlFor="upload-branch" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Branch *
                </label>
                <input
                  id="upload-branch"
                  list="branches-list"
                  className={`input-field ${errors.branch ? 'border-red-400' : ''}`}
                  placeholder="Select or type Branch"
                  {...register('branch', { required: 'Branch is required' })}
                />
                <datalist id="branches-list">
                  {options.branches.map(b => <option key={b} value={b} />)}
                </datalist>
                {errors.branch && <p className="text-red-500 text-xs mt-1">{errors.branch.message}</p>}
              </div>
            </div>

            {/* Year & Semester */}
            <div className={`grid ${isSyllabus ? 'grid-cols-1' : 'grid-cols-2'} gap-4`}>
              <div>
                <label htmlFor="upload-year" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Year *
                </label>
                <input
                  id="upload-year"
                  list="years-list"
                  className={`input-field ${errors.year ? 'border-red-400' : ''}`}
                  placeholder="Select or type Year"
                  {...register('year', { required: 'Year is required' })}
                />
                <datalist id="years-list">
                  {options.years.map(y => <option key={y} value={y} />)}
                </datalist>
                {errors.year && <p className="text-red-500 text-xs mt-1">{errors.year.message}</p>}
              </div>
              
              {!isSyllabus && (
                <div>
                  <label htmlFor="upload-semester" className="block text-sm font-medium text-gray-700 mb-1.5">
                    Semester *
                  </label>
                  <input
                    id="upload-semester"
                    list="semesters-list"
                    type="number"
                    min="1"
                    max="10"
                    className={`input-field ${errors.semester ? 'border-red-400' : ''}`}
                    placeholder="Select Semester"
                    {...register('semester', { required: !isSyllabus ? 'Semester is required' : false })}
                  />
                  <datalist id="semesters-list">
                    {options.semesters.map(s => <option key={s} value={s} />)}
                  </datalist>
                  {errors.semester && <p className="text-red-500 text-xs mt-1">{errors.semester.message}</p>}
                </div>
              )}
            </div>

            {/* Resource Type & College */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="upload-resourceType" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Resource Type *
                </label>
                {isAdmin ? (
                  <>
                    <input
                      id="upload-resourceType"
                      list="resourceTypes-list"
                      className={`input-field ${errors.resourceType ? 'border-red-400' : ''}`}
                      placeholder="Select or type Resource Type"
                      {...register('resourceType', { required: 'Resource type is required' })}
                    />
                    <datalist id="resourceTypes-list">
                      {options.resourceTypes.map(t => <option key={t} value={t} />)}
                    </datalist>
                    {errors.resourceType && <p className="text-red-500 text-xs mt-1">{errors.resourceType.message}</p>}
                  </>
                ) : (
                  <input
                    id="upload-resourceType"
                    type="text"
                    readOnly
                    className="input-field bg-gray-50 text-gray-500 cursor-not-allowed"
                    defaultValue="Notes"
                    {...register('resourceType')}
                  />
                )}
              </div>
              <div>
                <label htmlFor="upload-college" className="block text-sm font-medium text-gray-700 mb-1.5">
                  College *
                </label>
                <CollegeAutocomplete
                  inputId="upload-college"
                  value={watch('college') || ''}
                  placeholder="Select or type College"
                  error={!!errors.college}
                  onChange={({ name }) => {
                    setValue('college', name, { shouldValidate: true });
                  }}
                />
                <input
                  type="hidden"
                  {...register('college', { required: 'College is required' })}
                />
                {errors.college && <p className="text-red-500 text-xs mt-1">{errors.college.message}</p>}
              </div>
            </div>

            {/* Unit */}
            <div>
              <label htmlFor="upload-unit" className="block text-sm font-medium text-gray-700 mb-1.5">
                Unit
              </label>
              <input
                id="upload-unit"
                type="text"
                className="input-field"
                placeholder="e.g. Unit 4"
                {...register('unit')}
              />
            </div>

            {/* Exam Important checkbox */}
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                {...register('isExamImportant')}
              />
              <span className="text-sm text-gray-700">⭐ Mark as Exam Important</span>
            </label>

            {/* File Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                File (PDF / Image) *
              </label>
              <div
                className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
                  file ? 'border-primary-300 bg-primary-50/50' : 'border-gray-300 hover:border-primary-400 hover:bg-gray-50'
                }`}
                onClick={() => document.getElementById('file-input').click()}
              >
                <input
                  id="file-input"
                  type="file"
                  accept=".pdf,image/jpeg,image/png"
                  className="hidden"
                  onChange={handleFileChange}
                />
                {file ? (
                  <div className="flex items-center justify-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center">
                      <svg className="w-5 h-5 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-medium text-gray-900">{file.name}</p>
                      <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); setFile(null); }}
                      className="ml-2 p-1 rounded-full hover:bg-red-100 text-red-500"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ) : (
                  <>
                    <svg className="w-10 h-10 mx-auto text-gray-300 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <p className="text-sm text-gray-600">Click to select PDF or Image</p>
                    <p className="text-xs text-gray-400 mt-1">Max 10MB • PDF, JPEG, PNG</p>
                  </>
                )}
              </div>
            </div>

            {/* Progress bar (shown during upload) */}
            {step === 'uploading' && (
              <div className="animate-fade-in">
                <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                  <span>Uploading...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                  <div
                    className="bg-primary-600 h-full rounded-full transition-all duration-300 ease-out"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={uploading}
              className="btn-primary w-full py-3"
              id="upload-submit"
            >
              {uploading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Uploading...
                </div>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  Upload Note
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default UploadNote;
