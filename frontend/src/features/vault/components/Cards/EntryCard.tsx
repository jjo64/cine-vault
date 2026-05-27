import type { VaultEntry } from "../../types";
import { ImageCard } from "./ImageCard/ImageCard";
import { VideoCard } from "./VideoCard/VideoCard";
import { AudioCard } from "./AudioCard/AudioCard";
import { MoodboardCard } from "./MoodboardCard/MoodboardCard";
import { ListCard } from "./ListCard/ListCard";
import { ReviewCard } from "./ReviewCard/ReviewCard";

interface EntryCardProps {
  entry: VaultEntry;
  avatar: string;
}

export function EntryCard({ entry, avatar }: EntryCardProps) {
  switch (entry.type) {
    case "image":
      return <ImageCard entry={entry} avatar={avatar} />;
    case "video":
      return <VideoCard entry={entry} avatar={avatar} />;
    case "audio":
      return <AudioCard entry={entry} avatar={avatar} />;
    case "moodboard":
      return <MoodboardCard entry={entry} avatar={avatar} />;
    case "list":
      return <ListCard entry={entry} avatar={avatar} />;
    case "review":
      return <ReviewCard entry={entry} avatar={avatar} />;
    default:
      return null;
  }
}
