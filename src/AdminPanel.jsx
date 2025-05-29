import React, { useState } from "react";
import "./AdminPanel.css";
import { useTranslation } from "react-i18next";

function AdminPanel() {
  const { t } = useTranslation();
  const [tab, setTab] = useState("movies");
  return (
    <div className="admin-panel">
      <h2>{t("admin_panel")}</h2>
      <div className="admin-tabs">
        <button
          onClick={() => setTab("movies")}
          className={tab === "movies" ? "active" : ""}
        >
          {t("movie_management")}
        </button>
        <button
          onClick={() => setTab("users")}
          className={tab === "users" ? "active" : ""}
        >
          {t("user_management")}
        </button>
      </div>
      <div className="admin-content">
        {tab === "movies" ? (
          <div>
            <h3>{t("movie_management")}</h3>
            <p>Mocked: Add/edit/delete movies here.</p>
          </div>
        ) : (
          <div>
            <h3>{t("user_management")}</h3>
            <p>Mocked: Add/edit/delete users here.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminPanel;
