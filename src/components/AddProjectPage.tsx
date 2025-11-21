import { useNavigate } from "react-router-dom";
import { AddProjectForm } from "./AddProjectForm";

export function AddProjectPage() {
  const navigate = useNavigate();
  return (
    <AddProjectForm
      isModal={false}
      onClose={() => navigate(-1)}
      onCreated={() => navigate("/")}
    />
  );
}