import { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import api, { errorMessage } from '../api/client';
import { todayISO } from '../utils.js';
import { useAuth } from '../context/AuthContext.jsx';

const empty = { type: 'lost', title: '', description: '', category: '', location: '', date: todayISO(), contactInfo: '' };

export default function PostItem({ editMode = false }) {
  const { id } = useParams();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [form, setForm] = useState({ ...empty, type: params.get('type') === 'found' ? 'found' : 'lost' });
  const [categories, setCategories] = useState([]);
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [blocked, setBlocked] = useState('');
  const { user } = useAuth();

  useEffect(() => {
    api.get('/items/categories').then((r) => setCategories(r.data));
    if (editMode) {
      api.get(`/items/${id}`).then(({ data }) => {
        if (user.role !== 'admin' && data.postedBy?._id !== user._id) {
          setBlocked('You can only edit items that you reported.');
          return;
        }
        setForm({
          type: data.type,
          title: data.title,
          description: data.description,
          category: data.category,
          location: data.location,
          date: data.date.slice(0, 10),
          contactInfo: data.contactInfo || '',
        });
        setPreview(data.image);
      }).catch((err) => setBlocked(errorMessage(err)));
    }
  }, [editMode, id, user]);

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  const pickImage = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 3 * 1024 * 1024) {
      setError('Image must be smaller than 3 MB');
      return;
    }
    setError('');
    setImage(file);
    setPreview(URL.createObjectURL(file));
  };

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    const body = new FormData();
    Object.entries(form).forEach(([k, v]) => body.append(k, v));
    if (image) body.append('image', image);
    try {
      const res = editMode ? await api.put(`/items/${id}`, body) : await api.post('/items', body);
      navigate(`/items/${res.data._id}`);
    } catch (err) {
      setError(errorMessage(err));
      setSaving(false);
    }
  };

  if (blocked) {
    return (
      <div className="container section narrow">
        <h1 className="page-title">Edit Report</h1>
        <div className="alert alert-error">{blocked}</div>
      </div>
    );
  }

  return (
    <div className="container section narrow">
      <h1 className="page-title">{editMode ? 'Edit Report' : 'Report an Item'}</h1>
      <p className="muted">Give as many details as you can. It helps the right person recognise the item.</p>

      <form className="card form" onSubmit={submit}>
        <div className="type-toggle">
          <button type="button" className={form.type === 'lost' ? 'active lost' : ''} onClick={() => setForm({ ...form, type: 'lost' })}>
            I lost something
          </button>
          <button type="button" className={form.type === 'found' ? 'active found' : ''} onClick={() => setForm({ ...form, type: 'found' })}>
            I found something
          </button>
        </div>

        <label>
          Item name *
          <input required maxLength={100} value={form.title} onChange={set('title')} placeholder="e.g. Black boAt earbuds" />
        </label>

        <div className="row">
          <label>
            Category *
            <select required value={form.category} onChange={set('category')}>
              <option value="">Select a category</option>
              {categories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </label>
          <label>
            {form.type === 'lost' ? 'Date lost *' : 'Date found *'}
            <input type="date" required max={todayISO()} value={form.date} onChange={set('date')} />
          </label>
        </div>

        <label>
          Location *
          <input required value={form.location} onChange={set('location')} placeholder="e.g. Main canteen, CSE Lab 3" />
        </label>

        <label>
          Description *
          <textarea
            required
            rows={4}
            maxLength={1000}
            value={form.description}
            onChange={set('description')}
            placeholder="Colour, brand, distinguishing marks, what was inside…"
          />
        </label>

        <label>
          Contact info (optional)
          <input value={form.contactInfo} onChange={set('contactInfo')} placeholder="Shared only with approved claimants" />
        </label>

        <label>
          Photo (optional, max 3 MB)
          <input type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={pickImage} />
        </label>
        {preview && <img src={preview} alt="Preview" className="upload-preview" />}

        {error && <div className="alert alert-error">{error}</div>}
        <button className="btn btn-primary btn-lg" disabled={saving}>
          {saving ? 'Saving…' : editMode ? 'Save changes' : 'Submit report'}
        </button>
      </form>
    </div>
  );
}
