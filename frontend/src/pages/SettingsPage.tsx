import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Divider,
  Grid,
  Stack,
  TextField,
  Typography
} from "@mui/material";
import { AccountCircle, DeleteOutline, Lock, Save, Upload } from "@mui/icons-material";
import { useAppDispatch, useAppSelector } from "../app/hooks.js";
import { logoutLocal, setUser } from "../features/authSlice.js";
import {
  useChangePasswordMutation,
  useDeleteUserProfileMutation,
  useUpdateUserProfileMutation,
  useUploadAvatarMutation
} from "../features/api.js";
import { ErrorState } from "../components/ErrorState.js";

const AVATAR_MIMES = ["image/png", "image/jpeg", "image/webp"];

export function SettingsPage() {
  const currentUser = useAppSelector((state) => state.auth.user);
  const [updateProfile, { isLoading: saving }] = useUpdateUserProfileMutation();
  const [uploadAvatar, { isLoading: uploading }] = useUploadAvatarMutation();
  const [changePassword, { isLoading: changing }] = useChangePasswordMutation();
  const [deleteProfile, { isLoading: deleting }] = useDeleteUserProfileMutation();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const [form, setForm] = useState({ name: "", email: "" });
  const [pwForm, setPwForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [message, setMessage] = useState("");
  const [formError, setFormError] = useState("");
  const [pwMessage, setPwMessage] = useState("");
  const [pwError, setPwError] = useState("");

  useEffect(() => {
    if (currentUser) {
      setForm({
        name: currentUser.name ?? "",
        email: currentUser.email
      });
    }
  }, [currentUser]);

  const initials = useMemo(() => {
    const value = currentUser?.name || currentUser?.email || "A";
    return value.slice(0, 1).toUpperCase();
  }, [currentUser]);

  const avatarUrl = currentUser?.avatarUrl;

  async function handleImage(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setFormError("");

    if (!AVATAR_MIMES.includes(file.type)) {
      setFormError("Use a PNG, JPG, or WEBP image.");
      return;
    }
    if (file.size > 1_500_000) {
      setFormError("Use an image smaller than 1.5 MB.");
      return;
    }

    try {
      const result = await uploadAvatar(file).unwrap();
      dispatch(setUser(result.user));
    } catch {
      setFormError("Could not upload image.");
    }
  }

  async function handleSaveProfile(event: FormEvent) {
    event.preventDefault();
    setMessage("");
    setFormError("");
    try {
      const result = await updateProfile({ name: form.name, email: form.email }).unwrap();
      dispatch(setUser(result.user));
      setMessage("Profile updated.");
    } catch {
      setFormError("Could not update profile.");
    }
  }

  async function handleChangePassword(event: FormEvent) {
    event.preventDefault();
    setPwMessage("");
    setPwError("");

    if (pwForm.newPassword !== pwForm.confirmPassword) {
      setPwError("Passwords do not match.");
      return;
    }

    try {
      const result = await changePassword({
        currentPassword: pwForm.currentPassword,
        newPassword: pwForm.newPassword
      }).unwrap();
      setPwMessage(result.message);
      setPwForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err: unknown) {
      const data = (err as { data?: { error?: string } })?.data;
      setPwError(data?.error ?? "Could not change password.");
    }
  }

  async function handleDelete() {
    const confirmed = window.confirm("Delete your account and all related apps? This cannot be undone.");
    if (!confirmed) return;
    await deleteProfile().unwrap();
    dispatch(logoutLocal());
    navigate("/register");
  }

  return (
    <Box sx={{ display: "grid", gap: 3, maxWidth: 1000 }}>
      <Box>
        <Typography variant="h4">Settings</Typography>
        <Typography color="text.secondary">Manage your avatar, profile, password, and account.</Typography>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Stack alignItems="center" spacing={2}>
                <Avatar sx={{ width: 132, height: 132, bgcolor: "primary.main", fontSize: 44 }}>
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    initials
                  )}
                </Avatar>
                <Box sx={{ textAlign: "center" }}>
                  <Typography variant="h6">{currentUser?.name || "Unnamed user"}</Typography>
                  <Typography color="text.secondary">{currentUser?.email}</Typography>
                </Box>
                <Button component="label" variant="outlined" startIcon={uploading ? <CircularProgress size={16} /> : <Upload />} disabled={uploading}>
                  {uploading ? "Uploading..." : "Upload image"}
                  <input hidden type="file" accept="image/png,image/jpeg,image/webp" onChange={handleImage} />
                </Button>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2 }}>
                <AccountCircle color="primary" />
                <Box>
                  <Typography variant="h6">Profile Details</Typography>
                  <Typography variant="body2" color="text.secondary">Name and email associated with your account.</Typography>
                </Box>
              </Stack>
              <Divider sx={{ mb: 3 }} />
              <Box component="form" onSubmit={handleSaveProfile} sx={{ display: "grid", gap: 2.5 }}>
                <TextField label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required fullWidth />
                <TextField label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required fullWidth />
                {formError && <ErrorState message={formError} />}
                {message && <Typography color="success.main">{message}</Typography>}
                <Button type="submit" variant="contained" startIcon={<Save />} disabled={saving} sx={{ alignSelf: "flex-start" }}>
                  {saving ? "Saving..." : "Save profile"}
                </Button>
              </Box>
            </CardContent>
          </Card>

          <Card sx={{ mt: 3 }}>
            <CardContent>
              <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2 }}>
                <Lock color="primary" />
                <Box>
                  <Typography variant="h6">Change Password</Typography>
                  <Typography variant="body2" color="text.secondary">You will be logged out after changing your password.</Typography>
                </Box>
              </Stack>
              <Divider sx={{ mb: 3 }} />
              <Box component="form" onSubmit={handleChangePassword} sx={{ display: "grid", gap: 2.5 }}>
                <TextField label="Current password" type="password" value={pwForm.currentPassword} onChange={(e) => setPwForm({ ...pwForm, currentPassword: e.target.value })} required fullWidth />
                <TextField label="New password" type="password" value={pwForm.newPassword} onChange={(e) => setPwForm({ ...pwForm, newPassword: e.target.value })} required fullWidth helperText="At least 8 characters" />
                <TextField label="Confirm new password" type="password" value={pwForm.confirmPassword} onChange={(e) => setPwForm({ ...pwForm, confirmPassword: e.target.value })} required fullWidth />
                {pwError && <ErrorState message={pwError} />}
                {pwMessage && <Typography color="success.main">{pwMessage}</Typography>}
                <Button type="submit" variant="contained" color="warning" startIcon={<Lock />} disabled={changing} sx={{ alignSelf: "flex-start" }}>
                  {changing ? "Changing..." : "Change password"}
                </Button>
              </Box>
            </CardContent>
          </Card>

          <Card sx={{ mt: 3 }}>
            <CardContent>
              <Typography variant="h6" color="error" sx={{ mb: 1 }}>Danger Zone</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Permanently delete your account and all associated data. This cannot be undone.
              </Typography>
              <Button color="error" variant="outlined" startIcon={<DeleteOutline />} onClick={handleDelete} disabled={deleting}>
                {deleting ? "Deleting..." : "Delete account"}
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
