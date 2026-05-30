import React, { useState } from "react";

const MainBoard = () => {
  const [error, setError] = useState(false);

  const handleError = () => {
    setError(true);
  };

  return (
    <div className="w-100 h-100 position-relative">
      <div className="card h-100">
        <div className="card-body p-0" style={{ height: "100vh" }}>
          {error ? (
            <div
              className="alert alert-danger d-flex align-items-center m-3"
              role="alert"
            >
              <i className="bi bi-exclamation-triangle-fill me-2"></i>
              <div>
                Không thể tải file PDF. Vui lòng kiểm tra lại đường dẫn file
                trong thư mục public.
              </div>
            </div>
          ) : (
            <object
              data="/i.pdf"
              type="application/pdf"
              className="w-100 h-100"
              onError={handleError}
            >
              <div className="alert alert-warning m-3" role="alert">
                <i className="bi bi-exclamation-triangle-fill me-2"></i>
                Trình duyệt của bạn không hỗ trợ xem PDF trực tiếp.
              </div>
            </object>
          )}
        </div>
      </div>
    </div>
  );
};

export default MainBoard;
