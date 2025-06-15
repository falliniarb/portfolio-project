import React from 'react';

// This is a special CSS file for our modal. We will create it next.
import './DetailModal.css'; 

function DetailModal({ node, onClose }) {
  // If no node is selected, the modal is "closed", so we render nothing.
  if (!node) {
    return null;
  }

  // The 'details' object comes directly from our JSON data for the selected node.
  const { role, company, duration, points, projects } = node.details;

  return (
    // The backdrop is the semi-transparent background behind the modal.
    // Clicking it will close the modal.
    <div className="modal-backdrop" onClick={onClose}>
      {/* We use stopPropagation to prevent a click inside the modal from closing it. */}
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        
        <div className="modal-header">
          <h2>{role}</h2>
          <h3>{company}</h3>
          <p className="modal-duration">{duration}</p>
        </div>

        <div className="modal-body">
          <h4>Key Achievements:</h4>
          <ul>
            {points.map((point, index) => (
              <li key={index}>{point}</li>
            ))}
          </ul>

          {/* We only show the projects section if there are any projects */}
          {projects && projects.length > 0 && (
            <div className="modal-projects">
              <h4>Key Projects:</h4>
              {projects.map((project, index) => (
                <div key={index} className="project-item">
                  <strong>{project.title}</strong>: {project.description}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button onClick={onClose}>Close</button>
        </div>

      </div>
    </div>
  );
}

export default DetailModal;