import './App.css';
import {BrowserRouter,Routes,Route} from 'react-router-dom';
import Home from './components/Home/Home';
import Editor from './components/Editor/Editor';
import {Toaster} from 'react-hot-toast';

function App() {
  return (
    <>
    <div>
      <Toaster position='top-right' toastOptions={{success:{theme:{primary:"#4aee88"}}}}></Toaster>
    </div>
    <BrowserRouter>
        <Routes>
            <Route path='/' element={<Home />} />
            <Route path='/editor/:roomId' element={<Editor />} />
        </Routes>
    </BrowserRouter>
    </>
  );
}

export default App;
