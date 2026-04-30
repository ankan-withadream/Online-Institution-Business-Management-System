import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { CheckCircle } from 'lucide-react';
import api from '../../services/api';
import { useFetch } from '../../hooks/useFetch';
import { uploadDocumentPublic } from '../../services/documents';

const COURSE_CATEGORY_OPTIONS = [
  'Nursing',
  'Paramedical',
  'Allied Health',
  'Medical Laboratory',
  'Radiology & Imaging',
  'Emergency & Trauma Care',
  'Healthcare Management',
  'Skill Development',
];

const FranchiseApplyPage = () => {
  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm();
  const { data: courses } = useFetch('/courses');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [files, setFiles] = useState({
    applicant_photo: null,
    aadhaar_card: null,
    voter_id: null,
    driving_license: null,
    building_agreement: null,
    teaching_facility_photo: null,
    classroom_facility_photo: null,
  });

  const handleFileChange = (docType) => (e) => {
    setFiles((prev) => ({ ...prev, [docType]: e.target.files?.[0] || null }));
  };

  const onSubmit = async (data) => {
    setError('');

    if (!files.applicant_photo) {
      setError('Please upload the applicant photo');
      return;
    }

    if (!files.aadhaar_card) {
      setError('Please upload the Aadhaar card photo');
      return;
    }

    setLoading(true);
    try {
      // Remove confirmPassword before sending to API
      const { confirmPassword, courseCategories, courseIds, ...rest } = data;
      void confirmPassword;
      const submitData = {
        ...rest,
        courseCategories: Array.isArray(courseCategories) ? courseCategories : courseCategories ? [courseCategories] : [],
        courseIds: Array.isArray(courseIds) ? courseIds : courseIds ? [courseIds] : [],
      };
      const response = await api.post('/franchises/apply', submitData);
      const franchiseId = response.data?.franchise?.id;

      if (franchiseId) {
        for (const [docType, file] of Object.entries(files)) {
          if (file) {
            try {
              await uploadDocumentPublic({
                file,
                entityType: 'franchise',
                entityId: franchiseId,
                documentType: docType,
              });
            } catch (uploadErr) {
              console.error(`Failed to upload ${docType}:`, uploadErr);
            }
          }
        }
      }

      setSubmitted(true);
      reset();
      setFiles({
        applicant_photo: null,
        aadhaar_card: null,
        voter_id: null,
        driving_license: null,
        building_agreement: null,
        teaching_facility_photo: null,
        classroom_facility_photo: null,
      });
    } catch (err) {
      setError(err.response?.data?.error || 'Submission failed');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="section">
        <div className="container" style={{ maxWidth: 600, textAlign: 'center' }}>
          <div className="card" style={{ padding: '3rem' }}>
            <CheckCircle size={64} style={{ color: '#22c55e', margin: '0 auto 1rem' }} />
            <h2 style={{ fontWeight: 700, marginBottom: '0.5rem' }}>Application Submitted!</h2>
            <p style={{ color: '#6b7280' }}>
              Your franchise application has been received. Our team will review it and get back to you shortly.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="section">
      <div className="container" style={{ maxWidth: 700 }}>
        <h1 className="section-title">Apply for Franchise Partnership</h1>
        <p className="section-subtitle">Fill out the form below to become an EduCare franchise partner</p>

        <div className="card" style={{ padding: '2rem' }}>
          {error && <p className="form-error" style={{ marginBottom: '1rem' }}>{error}</p>}

          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="grid grid-2">
              <div className="form-group">
                <label className="form-label">Organization Name *</label>
                <input className="form-input" {...register('organizationName', { required: true, minLength: 2 })} />
                {errors.organizationName && <span className="form-error">Required (min 2 chars)</span>}
              </div>
              <div className="form-group">
                <label className="form-label">Contact Person *</label>
                <input className="form-input" {...register('contactPerson', { required: true, minLength: 2 })} />
                {errors.contactPerson && <span className="form-error">Required</span>}
              </div>
              <div className="form-group">
                <label className="form-label">Email *</label>
                <input className="form-input" type="email" {...register('email', { required: true })} />
                {errors.email && <span className="form-error">Required</span>}
              </div>
              <div className="form-group">
                <label className="form-label">Phone *</label>
                <input className="form-input" {...register('phone', { required: true, minLength: 10 })} />
                {errors.phone && <span className="form-error">10+ digits required</span>}
              </div>
              <div className="form-group">
                <label className="form-label">Password *</label>
                <input className="form-input" type="password" {...register('password', { required: true, minLength: 8 })} />
                {errors.password?.type === 'required' && <span className="form-error">Required</span>}
                {errors.password?.type === 'minLength' && <span className="form-error">Min 8 chars</span>}
              </div>
              <div className="form-group">
                <label className="form-label">Confirm Password *</label>
                <input className="form-input" type="password" {...register('confirmPassword', { 
                  required: true,
                  validate: val => val === watch('password') || 'Passwords do not match'
                })} />
                {errors.confirmPassword?.type === 'required' && <span className="form-error">Required</span>}
                {errors.confirmPassword?.message && <span className="form-error">{errors.confirmPassword.message}</span>}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Address *</label>
              <input className="form-input" {...register('address', { required: true, minLength: 5 })} />
            </div>

            <div className="grid grid-3">
              <div className="form-group">
                <label className="form-label">City *</label>
                <input className="form-input" {...register('city', { required: true })} />
              </div>
              <div className="form-group">
                <label className="form-label">State *</label>
                <input className="form-input" {...register('state', { required: true })} />
              </div>
              <div className="form-group">
                <label className="form-label">Pincode *</label>
                <input className="form-input" {...register('pincode', { required: true, minLength: 6, maxLength: 6 })} />
              </div>
            </div>

            <h3 style={{ marginTop: '2rem', marginBottom: '1rem', borderBottom: '1px solid #e5e7eb', paddingBottom: '0.5rem' }}>Facility & Course Details</h3>

            <div className="grid grid-2">
              <div className="form-group">
                <label className="form-label">Do you have any building or rental? *</label>
                <select className="form-select" {...register('hasBuildingOrRental', { required: true })}>
                  <option value="">Select</option>
                  <option value="yes">Yes</option>
                  <option value="no">No</option>
                </select>
                {errors.hasBuildingOrRental && <span className="form-error">Required</span>}
              </div>
              <div className="form-group">
                <label className="form-label">Do you have experience in education & training? *</label>
                <select className="form-select" {...register('hasEducationExperience', { required: true })}>
                  <option value="">Select</option>
                  <option value="yes">Yes</option>
                  <option value="no">No</option>
                </select>
                {errors.hasEducationExperience && <span className="form-error">Required</span>}
              </div>
            </div>

            <div className="grid grid-2">
              <div className="form-group">
                <label className="form-label">Course categories you want to run *</label>
                <select className="form-select" multiple size={5} {...register('courseCategories', { required: true })}>
                  {COURSE_CATEGORY_OPTIONS.map(option => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
                {errors.courseCategories && <span className="form-error">Select at least one</span>}
                <p style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem' }}>Hold Ctrl/Cmd to select multiple.</p>
              </div>
              <div className="form-group">
                <label className="form-label">Course names *</label>
                <select className="form-select" multiple size={5} {...register('courseIds', { required: true })}>
                  {courses?.map(course => (
                    <option key={course.id} value={course.id}>{course.name}</option>
                  ))}
                </select>
                {errors.courseIds && <span className="form-error">Select at least one</span>}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Details regarding teaching facility *</label>
              <textarea
                className="form-input"
                rows={4}
                placeholder="Example: 3 trainers, 1 lab instructor, smart board, 20 desktops with internet access."
                {...register('teachingFacilityDetails', { required: true, minLength: 10 })}
              />
              {errors.teachingFacilityDetails && <span className="form-error">Please share details (min 10 chars)</span>}
            </div>

            <div className="form-group">
              <label className="form-label">Teaching facility photo (optional)</label>
              <input className="form-input" type="file" accept="image/*,application/pdf" onChange={handleFileChange('teaching_facility_photo')} />
            </div>

            <div className="form-group">
              <label className="form-label">Details regarding classrooms and facilities *</label>
              <textarea
                className="form-input"
                rows={4}
                placeholder="Example: 4 classrooms (30 seats each), skills lab, library corner, washrooms, power backup."
                {...register('classroomFacilityDetails', { required: true, minLength: 10 })}
              />
              {errors.classroomFacilityDetails && <span className="form-error">Please share details (min 10 chars)</span>}
            </div>

            <div className="form-group">
              <label className="form-label">Classroom/facility photo (optional)</label>
              <input className="form-input" type="file" accept="image/*,application/pdf" onChange={handleFileChange('classroom_facility_photo')} />
            </div>

            <div className="form-group">
              <label className="form-label">Any other relevant information</label>
              <textarea
                className="form-input"
                rows={3}
                placeholder="Example: Planned partnerships, staffing details, or other notes."
                {...register('otherInformation')}
              />
            </div>

            <h3 style={{ marginTop: '2rem', marginBottom: '1rem', borderBottom: '1px solid #e5e7eb', paddingBottom: '0.5rem' }}>Upload Documents</h3>
            <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '1rem' }}>Please provide clear images/PDFs. Max size 5MB per file.</p>

            <div className="grid grid-2">
              <div className="form-group">
                <label className="form-label">Applicant Photo *</label>
                <input className="form-input" type="file" accept="image/*,application/pdf" onChange={handleFileChange('applicant_photo')} required />
              </div>
              <div className="form-group">
                <label className="form-label">Aadhaar Card Photo *</label>
                <input className="form-input" type="file" accept="image/*,application/pdf" onChange={handleFileChange('aadhaar_card')} required />
              </div>
              <div className="form-group">
                <label className="form-label">Voter ID Photo (Optional)</label>
                <input className="form-input" type="file" accept="image/*,application/pdf" onChange={handleFileChange('voter_id')} />
              </div>
              <div className="form-group">
                <label className="form-label">Driving License Photo (Optional)</label>
                <input className="form-input" type="file" accept="image/*,application/pdf" onChange={handleFileChange('driving_license')} />
              </div>
              <div className="form-group">
                <label className="form-label">Building Agreement / Rental Agreement (Optional)</label>
                <input className="form-input" type="file" accept="image/*,application/pdf" onChange={handleFileChange('building_agreement')} />
              </div>
            </div>

            <button className="btn btn-primary btn-lg" type="submit" style={{ width: '100%', marginTop: '1.5rem' }} disabled={loading}>
              {loading ? 'Submitting...' : 'Submit Application'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default FranchiseApplyPage;
