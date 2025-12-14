import React from 'react';
import { useHistory } from "react-router-dom";
import './Home.css';

function Home() {
    const history = useHistory();

    const redirectTo = (path) => {
        history.push(path);
    }

    return (
        <div className="home-container">
            <div className="home-card">
                <h3 className="home-title">Supply Chain Manager</h3>
                <div className="home-button-group">
                    <button 
                        className="btn btn-primary home-btn" 
                        onClick={() => redirectTo('/roles')}
                    >
                        Register Roles
                    </button>
                    <button 
                        className="btn btn-outline home-btn" 
                        onClick={() => redirectTo('/addmed')}
                    >
                        Order Materials
                    </button>
                    <button 
                        className="btn btn-outline home-btn" 
                        onClick={() => redirectTo('/supply')}
                    >
                         Supply Chain
                    </button>
                    <button 
                        className="btn btn-outline home-btn" 
                        onClick={() => redirectTo('/track')}
                    >
                        Track Materials
                    </button>
                    <button 
                        className="btn btn-outline home-btn" 
                        onClick={() => redirectTo('/verify')}
                    >
                        Verify Product
                    </button>
                    <button 
                        className="btn btn-outline home-btn" 
                        onClick={() => redirectTo('/trustscore')}
                    >
                        TrustScore
                    </button>
                    <button 
                        className="btn btn-outline home-btn" 
                        style={{ gridColumn: '1 / -1' }}
                        onClick={() => redirectTo('/admin/anticounterfeit')}
                    >
                         Anti-Counterfeit Dashboard
                    </button>
                </div>
            </div>
        </div>
    );
}

export default Home;
