import React from "react";

const WeakPointItem = ({ item, onView, onEdit, onDelete }) => {
  return (
    <div className="col-md-4 mb-4">
      <div className="card h-100 shadow-sm hover-effect">
        <div className="card-img-container">
          <img
            src={item.img}
            alt={item.name || "Component"}
            className="card-img-top p-2"
            style={{ height: "180px", objectFit: "contain" }}
            onClick={() => onView(item)}
          />
        </div>
        <div className="card-body">
          <h5 className="card-title">{item.name || "Unnamed Component"}</h5>
          {item.description && (
            <p className="card-text text-truncate">{item.description}</p>
          )}
        </div>
        <div className="card-footer bg-transparent">
          <div className="btn-group w-100">
            <button
              className="btn btn-sm btn-outline-primary"
              onClick={() => onView(item)}
            >
              <i className="bi bi-eye me-1"></i> View
            </button>
            <button
              className="btn btn-sm btn-outline-secondary"
              onClick={() => onEdit(item)}
            >
              <i className="bi bi-pencil me-1"></i> Edit
            </button>
            <button
              className="btn btn-sm btn-outline-danger"
              onClick={() => onDelete(item)}
            >
              <i className="bi bi-trash me-1"></i> Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WeakPointItem;
