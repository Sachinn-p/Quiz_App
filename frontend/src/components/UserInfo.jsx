import React, { useEffect, useState } from "react";
import axios from "axios";

const UserInfo = () => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchUser = async () => {
            const token = localStorage.getItem("token");
            if (!token) {
                setLoading(false);
                setError("No token found. Please log in.");
                return;
            }
            try {
                const response = await axios.get("http://127.0.0.1:8000/user-info", {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });
                setUser(response.data);
                setLoading(false);
            } catch (error) {
                setLoading(false);
                setError("Error fetching user data. Please try again.");
                console.error("Error fetching user data", error);
            }
        };

        fetchUser();
    }, []);

    if (loading) {
        return <p>Loading...</p>;
    }

    if (error) {
        return <p>{error}</p>;
    }

    return (
        <div>
            <h2>Welcome, {user.username}</h2>
            <p>{user.data}</p>
        </div>
    );
};

export default UserInfo;
