import AdminCrud from '../../components/AdminCrud.jsx';
import { adminConfigs } from './adminConfigs.js';

export default function AdminEntityPage({ resource }) {
  return <AdminCrud config={adminConfigs[resource]} />;
}
