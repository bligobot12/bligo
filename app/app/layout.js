import AppNav from '../../components/AppNav';

export default function ProductLayout({ children }) {
  return (
    <>
      <AppNav />
      {children}
    </>
  );
}
