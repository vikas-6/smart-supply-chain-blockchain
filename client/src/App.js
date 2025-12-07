import './App.css';
import AssignRoles from './AssignRoles';
import Home from './Home';
import AddMed from './AddMed';
import Supply from './Supply';
import Track from './Track';
import AntiCounterfeitDashboard from './AntiCounterfeitDashboard';
import VerifyProduct from './VerifyProduct';
import TrustScoreLeaderboard from './TrustScoreLeaderboard';
import { BrowserRouter as Router, Switch, Route } from "react-router-dom";

function App() {
  return (
    <div className="App">
      <Router>
        <Switch>
          <Route path="/" exact component={Home} />
          <Route path="/roles" component={AssignRoles} />
          <Route path="/addmed" component={AddMed} />
          <Route path="/supply" component={Supply} />
          <Route path="/track" component={Track} />
          <Route path="/admin/anticounterfeit" component={AntiCounterfeitDashboard} />
          <Route path="/verify/:productId" component={VerifyProduct} />
          <Route path="/verify" exact component={VerifyProduct} />
          <Route path="/trustscore" component={TrustScoreLeaderboard} />
        </Switch>
      </Router>
    </div>
  );
}

export default App;
