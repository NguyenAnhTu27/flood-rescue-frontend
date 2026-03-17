import React, { useState, useEffect } from "react";

const EyeIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24">
        <path
            fill="currentColor"
            d="M12 5C6 5 2 12 2 12s4 7 10 7s10-7 10-7s-4-7-10-7Zm0 11a4 4 0 1 1 0-8a4 4 0 0 1 0 8Z"
        />
    </svg>
);

const EyeSlashIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24">
        <path
            fill="currentColor"
            d="M2 5l2-2l18 18l-2 2l-4.2-4.2A10.6 10.6 0 0 1 12 19c-6 0-10-7-10-7a21.8 21.8 0 0 1 5.2-5.8L2 5Zm20 7s-4-7-10-7c-1.4 0-2.7.3-4 .8l1.6 1.6A4 4 0 0 1 16.6 14L22 12Z"
        />
    </svg>
);

export default function AdminDashboard() {

    const token = localStorage.getItem("token");

    const API = "http://localhost:8080/api/admin";

    const [users, setUsers] = useState([]);
    const [message, setMessage] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [resetPasswords, setResetPasswords] = useState({});

    const [keyword, setKeyword] = useState("");
    const [roleId, setRoleId] = useState("");

    const [form, setForm] = useState({
        fullName: "",
        email: "",
        phone: "",
        password: "",
        roleId: 1
    });

    // =========================
    // CREATE USER
    // =========================

    const createUser = async () => {

        const res = await fetch(`${API}/create-user`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + token
            },
            body: JSON.stringify(form)
        });

        const data = await res.json();

        setMessage(data.message || "User created");

        getUsers();
    };

    // =========================
    // GET USERS
    // =========================

    const getUsers = async () => {

        const query = new URLSearchParams({
            keyword,
            roleId,
            page:0
        });

        const res = await fetch(`${API}/users?${query}`, {
            headers: {
                "Authorization": "Bearer " + token
            }
        });

        const data = await res.json();

        setUsers(data.content || []);
    };

    /* eslint-disable react-hooks/exhaustive-deps */
    useEffect(()=>{
        getUsers();
    },[]);
    /* eslint-enable react-hooks/exhaustive-deps */

    // =========================
    // DELETE USER
    // =========================

    const deleteUser = async (id) => {

        const res = await fetch(`${API}/delete-user/${id}`, {
            method: "DELETE",
            headers: {
                "Authorization": "Bearer " + token
            }
        });

        const data = await res.json();

        setMessage(data.message || "Deleted");

        getUsers();
    };

    // =========================
    // RESET PASSWORD
    // =========================

    const resetPassword = async (id) => {

        const password = resetPasswords[id];

        if (!password) {
            setMessage("Nhập password mới");
            return;
        }

        const res = await fetch(`${API}/reset-password/${id}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + token
            },
            body: JSON.stringify({ password })
        });

        const data = await res.json();

        setMessage(data.message || "Password updated");

        setResetPasswords({
            ...resetPasswords,
            [id]: ""
        });
    };

    // =========================
    // UPDATE STATUS
    // =========================

    const toggleStatus = async (id,status) => {

        const res = await fetch(`${API}/update-status/${id}`,{
            method:"PUT",
            headers:{
                "Content-Type":"application/json",
                "Authorization":"Bearer "+token
            },
            body:JSON.stringify({
                status: !status
            })
        });

        const data = await res.json();

        setMessage(data.message || "Status updated");

        getUsers();
    };

    return (
        <div className="rounded-xl border bg-white p-6 space-y-6">

            <h1 className="text-2xl font-semibold">
                Admin Dashboard
            </h1>

            {/* CREATE USER */}

            <div className="border p-4 rounded-lg space-y-3">

                <h2 className="font-semibold">
                    Tạo Account
                </h2>

                <div className="flex flex-wrap gap-2">

                    <input
                        className="border p-2"
                        placeholder="Full name"
                        onChange={(e)=>setForm({...form, fullName:e.target.value})}
                    />

                    <input
                        className="border p-2"
                        placeholder="Email"
                        onChange={(e)=>setForm({...form, email:e.target.value})}
                    />

                    <input
                        className="border p-2"
                        placeholder="Phone"
                        onChange={(e)=>setForm({...form, phone:e.target.value})}
                    />

                    <div className="flex items-center border rounded">

                        <input
                            className="p-2 outline-none"
                            placeholder="Password"
                            type={showPassword ? "text" : "password"}
                            onChange={(e)=>setForm({...form, password:e.target.value})}
                        />

                        <button
                            type="button"
                            onClick={()=>setShowPassword(!showPassword)}
                            className="px-2 text-gray-500"
                        >
                            {showPassword ? <EyeSlashIcon/> : <EyeIcon/>}
                        </button>

                    </div>

                    <select
                        className="border p-2"
                        value={form.roleId}
                        onChange={(e)=>setForm({...form, roleId:Number(e.target.value)})}
                    >
                        <option value="1">CITIZEN</option>
                        <option value="2">COORDINATOR</option>
                        <option value="3">RESCUER</option>
                        <option value="4">MANAGER</option>
                    </select>

                    <button
                        onClick={createUser}
                        className="bg-blue-500 text-white px-4 py-2 rounded"
                    >
                        Tạo
                    </button>

                </div>

            </div>

            {/* SEARCH */}

            <div className="flex gap-2">

                <input
                    className="border p-2"
                    placeholder="Search keyword"
                    onChange={(e)=>setKeyword(e.target.value)}
                />

                <select
                    className="border p-2"
                    onChange={(e)=>setRoleId(e.target.value)}
                >
                    <option value="">ALL</option>
                    <option value="1">CITIZEN</option>
                    <option value="2">COORDINATOR</option>
                    <option value="3">RESCUER</option>
                    <option value="4">MANAGER</option>
                </select>

                <button
                    onClick={getUsers}
                    className="bg-green-500 text-white px-4 py-2 rounded"
                >
                    Search
                </button>

            </div>

            {/* USER TABLE */}

            <div className="border rounded">

                {users.map(user => (

                    <div
                        key={user.id}
                        className="flex items-center justify-between px-4 py-2 border-t"
                    >

                        <div className="text-sm">
                            {user.id} | {user.fullName} | {user.email} | {user.role?.name}
                        </div>

                        <div className="flex items-center gap-2">

                            <input
                                className="border p-1 text-sm"
                                placeholder="new password"
                                type="password"
                                value={resetPasswords[user.id] || ""}
                                onChange={(e)=>
                                    setResetPasswords({
                                        ...resetPasswords,
                                        [user.id]: e.target.value
                                    })
                                }
                            />

                            <button
                                onClick={()=>resetPassword(user.id)}
                                className="bg-yellow-500 text-white px-2 py-1 rounded text-sm"
                            >
                                Reset
                            </button>

                            <button
                                onClick={()=>toggleStatus(user.id,user.active)}
                                className="bg-gray-500 text-white px-2 py-1 rounded text-sm"
                            >
                                {user.active ? "Disable" : "Enable"}
                            </button>

                            <button
                                onClick={()=>deleteUser(user.id)}
                                className="text-red-500"
                            >
                                Xoá
                            </button>

                        </div>

                    </div>

                ))}

            </div>

            {message && (
                <div className="text-blue-600">
                    {message}
                </div>
            )}

        </div>
    );
}
