import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';

export default function MainLayout() {
  return (
    // min-h-screen forces the container to be exactly the screen height. 
    // flex-col stacks the Navbar and the Outlet.
    <div className="h-screen flex flex-col bg-brand-bg overflow-hidden">
      <Navbar />
      
      {/* flex-1 makes this container fill EXACTLY the remaining space.
          overflow-y-auto ensures that ONLY the content below the navbar scrolls */}
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}