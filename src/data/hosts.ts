import type { Host } from "@/types";

export const hosts: Host[] = [
  {
    id: "h1",
    name: "Anna",
    avatar: "https://i.pravatar.cc/160?img=5",
    joinedYear: 2018,
    isSuperhost: true,
  },
  {
    id: "h2",
    name: "Marco",
    avatar: "https://i.pravatar.cc/160?img=12",
    joinedYear: 2019,
    isSuperhost: true,
  },
  {
    id: "h3",
    name: "Sofia",
    avatar: "https://i.pravatar.cc/160?img=32",
    joinedYear: 2020,
    isSuperhost: false,
  },
  {
    id: "h4",
    name: "Liam",
    avatar: "https://i.pravatar.cc/160?img=15",
    joinedYear: 2017,
    isSuperhost: true,
  },
  {
    id: "h5",
    name: "Yuki",
    avatar: "https://i.pravatar.cc/160?img=45",
    joinedYear: 2021,
    isSuperhost: false,
  },
  {
    id: "h6",
    name: "Elena",
    avatar: "https://i.pravatar.cc/160?img=20",
    joinedYear: 2016,
    isSuperhost: true,
  },
  {
    id: "h7",
    name: "Noah",
    avatar: "https://i.pravatar.cc/160?img=8",
    joinedYear: 2022,
    isSuperhost: false,
  },
  {
    id: "h8",
    name: "Clara",
    avatar: "https://i.pravatar.cc/160?img=41",
    joinedYear: 2019,
    isSuperhost: true,
  },
];

export const hostById = new Map(hosts.map((h) => [h.id, h]));
