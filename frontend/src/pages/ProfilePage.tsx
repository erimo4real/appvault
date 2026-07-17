import { useParams } from "react-router-dom";
import {
  Avatar,
  Box,
  Card,
  CardContent,
  Divider,
  Grid,
  Stack,
  Typography
} from "@mui/material";
import { CalendarToday, Email, Person } from "@mui/icons-material";
import { useAppSelector } from "../app/hooks.js";
import { useUserProfileQuery } from "../features/api.js";
import { ErrorState } from "../components/ErrorState.js";

export function ProfilePage() {
  const { id } = useParams();
  const currentUser = useAppSelector((state) => state.auth.user);
  const profileId = id ?? currentUser?.id;
  const { data, error, isLoading } = useUserProfileQuery(profileId, { skip: !profileId });
  const user = data?.user ?? currentUser;

  if (isLoading) return <Typography color="text.secondary">Loading profile...</Typography>;
  if (error) return <ErrorState message="Could not load this profile." />;
  if (!user) return null;

  const initials = (user.name ?? user.email ?? "A").slice(0, 1).toUpperCase();
  const joined = user.createdAt ? new Date(user.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) : null;

  return (
    <Box sx={{ display: "grid", gap: 3, maxWidth: 800 }}>
      <Box>
        <Typography variant="h4">Profile</Typography>
        <Typography color="text.secondary">{user.name ?? user.email}</Typography>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Stack alignItems="center" spacing={2}>
                <Avatar sx={{ width: 132, height: 132, bgcolor: "primary.main", fontSize: 44 }}>
                  {user.avatarUrl ? (
                    <img src={user.avatarUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    initials
                  )}
                </Avatar>
                <Box sx={{ textAlign: "center" }}>
                  <Typography variant="h6">{user.name || "Unnamed user"}</Typography>
                  <Typography color="text.secondary">{user.email}</Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>Details</Typography>
              <Divider sx={{ mb: 2 }} />
              <Stack spacing={2}>
                <Stack direction="row" spacing={2} alignItems="center">
                  <Person color="action" />
                  <Box>
                    <Typography variant="body2" color="text.secondary">Name</Typography>
                    <Typography>{user.name || "Not set"}</Typography>
                  </Box>
                </Stack>
                <Stack direction="row" spacing={2} alignItems="center">
                  <Email color="action" />
                  <Box>
                    <Typography variant="body2" color="text.secondary">Email</Typography>
                    <Typography>{user.email}</Typography>
                  </Box>
                </Stack>
                {joined && (
                  <Stack direction="row" spacing={2} alignItems="center">
                    <CalendarToday color="action" />
                    <Box>
                      <Typography variant="body2" color="text.secondary">Joined</Typography>
                      <Typography>{joined}</Typography>
                    </Box>
                  </Stack>
                )}
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
