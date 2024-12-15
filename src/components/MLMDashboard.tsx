import { useState, useEffect } from 'react';
import { LineChart, XAxis, YAxis, Tooltip, Legend, Line } from 'recharts';

interface MLMNode {
    id: string;
    tier: number;
    directReferrals: string[];
    totalTeamSize: number;
    commissionRate: number;
    parentId: string | null;
    level: number;
    monthlyRevenue: number[];
    totalEarnings: number;
}

class MLMNetwork {
    private nodes: Map<string, MLMNode>;
    private monthsOfHistory: number = 12;

    constructor(totalNodes: number) {
        this.nodes = new Map();
        this.generateRandomNetwork(totalNodes);
    }

    private generateRandomNetwork(totalNodes: number): void {
        // Create root node
        const rootNode: MLMNode = {
            id: "root",
            tier: 1,
            directReferrals: [],
            totalTeamSize: 0,
            commissionRate: 30,
            parentId: null,
            level: 0,
            monthlyRevenue: this.generateRandomRevenue(),
            totalEarnings: 0
        };
        this.nodes.set("root", rootNode);

        // Generate remaining nodes
        for (let i = 1; i < totalNodes; i++) {
            const nodeId = `node${i}`;
            const potentialParents = Array.from(this.nodes.keys());
            const parentId = potentialParents[Math.floor(Math.random() * potentialParents.length)];
            const parentNode = this.nodes.get(parentId)!;
            
            const newNode: MLMNode = {
                id: nodeId,
                tier: 1,
                directReferrals: [],
                totalTeamSize: 0,
                commissionRate: 30,
                parentId: parentId,
                level: parentNode.level + 1,
                monthlyRevenue: this.generateRandomRevenue(),
                totalEarnings: 0
            };

            this.nodes.set(nodeId, newNode);
            parentNode.directReferrals.push(nodeId);
        }

        // Update network metrics
        this.updateNetworkMetrics();
    }

    private generateRandomRevenue(): number[] {
        return Array(this.monthsOfHistory).fill(0).map(() => 
            Math.floor(Math.random() * 5000) + 1000
        );
    }

    private updateNetworkMetrics(): void {
        // Update team sizes and tiers
        for (const [nodeId, node] of this.nodes) {
            this.updateNodeMetrics(nodeId);
        }

        // Calculate earnings
        for (const [nodeId, node] of this.nodes) {
            this.calculateNodeEarnings(nodeId);
        }
    }

    private updateNodeMetrics(nodeId: string): void {
        const node = this.nodes.get(nodeId)!;
        
        // Calculate team size
        node.totalTeamSize = this.calculateTeamSize(nodeId);
        
        // Update tier
        node.tier = this.calculateTier(node);
        node.commissionRate = this.getTierCommission(node.tier);
    }

    private calculateTeamSize(nodeId: string): number {
        const node = this.nodes.get(nodeId)!;
        let size = node.directReferrals.length;
        
        for (const referralId of node.directReferrals) {
            size += this.calculateTeamSize(referralId);
        }
        return size;
    }

    private calculateTier(node: MLMNode): number {
        const tierRequirements = [
            { tier: 7, directRefs: 20, teamSize: 1500 },
            { tier: 6, directRefs: 16, teamSize: 700 },
            { tier: 5, directRefs: 12, teamSize: 225 },
            { tier: 4, directRefs: 8, teamSize: 75 },
            { tier: 3, directRefs: 5, teamSize: 20 },
            { tier: 2, directRefs: 3, teamSize: 0 },
            { tier: 1, directRefs: 0, teamSize: 0 }
        ];

        for (const req of tierRequirements) {
            if (node.directReferrals.length >= req.directRefs && 
                node.totalTeamSize >= req.teamSize) {
                return req.tier;
            }
        }
        return 1;
    }

    private getTierCommission(tier: number): number {
        const commissions = {
            1: 30,
            2: 40,
            3: 50,
            4: 55,
            5: 60,
            6: 65,
            7: 70
        };
        return commissions[tier as keyof typeof commissions];
    }

    private calculateNodeEarnings(nodeId: string): void {
        const node = this.nodes.get(nodeId)!;
        let totalEarnings = 0;

        // Direct commission from personal sales
        totalEarnings += node.monthlyRevenue.reduce((a, b) => a + b, 0) * (node.commissionRate / 100);

        // Difference income from downline
        for (const referralId of node.directReferrals) {
            const referral = this.nodes.get(referralId)!;
            if (node.tier > referral.tier) {
                const difference = node.commissionRate - referral.commissionRate;
                totalEarnings += referral.monthlyRevenue.reduce((a, b) => a + b, 0) * (difference / 100);
            }
        }

        node.totalEarnings = totalEarnings;
    }

    getNodeReport(nodeId: string): {
        node: MLMNode,
        downline: MLMNode[],
        metrics: {
            totalTeamRevenue: number,
            averageTeamTier: number,
            monthlyTrends: Array<{ month: number, revenue: number, earnings: number }>
        }
    } {
        const node = this.nodes.get(nodeId)!;
        const downline = this.getDownline(nodeId);
        
        const totalTeamRevenue = downline.reduce((sum, n) => 
            sum + n.monthlyRevenue.reduce((a, b) => a + b, 0), 0);
        
        const averageTeamTier = downline.reduce((sum, n) => sum + n.tier, 0) / downline.length;

        const monthlyTrends = Array(this.monthsOfHistory).fill(0).map((_, month) => ({
            month: month + 1,
            revenue: node.monthlyRevenue[month],
            earnings: node.monthlyRevenue[month] * (node.commissionRate / 100)
        }));

        return {
            node,
            downline,
            metrics: {
                totalTeamRevenue,
                averageTeamTier,
                monthlyTrends
            }
        };
    }

    private getDownline(nodeId: string): MLMNode[] {
        const node = this.nodes.get(nodeId)!;
        let downline: MLMNode[] = [];
        
        for (const referralId of node.directReferrals) {
            const referral = this.nodes.get(referralId)!;
            downline.push(referral);
            downline = downline.concat(this.getDownline(referralId));
        }
        
        return downline;
    }
}

// React Component for visualization
const MLMDashboard = () => {
    const [network, setNetwork] = useState<MLMNetwork | null>(null);
    const [selectedNode, setSelectedNode] = useState<string>("root");
    const [report, setReport] = useState<any>(null);

    useEffect(() => {
        // Generate random network with 100 nodes
        const newNetwork = new MLMNetwork(100);
        setNetwork(newNetwork);
    }, []);

    useEffect(() => {
        if (network) {
            const nodeReport = network.getNodeReport(selectedNode);
            setReport(nodeReport);
        }
    }, [network, selectedNode]);

    if (!network || !report) return <div>Loading...</div>;

    return (
        <div className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Node Information */}
                <div className="bg-white p-4 rounded-lg shadow">
                    <h2 className="text-xl font-bold mb-4">Node Information</h2>
                    <div className="space-y-2">
                        <p>ID: {report.node.id}</p>
                        <p>Tier: {report.node.tier}</p>
                        <p>Team Size: {report.node.totalTeamSize}</p>
                        <p>Total Earnings: ${report.node.totalEarnings.toFixed(2)}</p>
                    </div>
                </div>

                {/* Team Metrics */}
                <div className="bg-white p-4 rounded-lg shadow">
                    <h2 className="text-xl font-bold mb-4">Team Metrics</h2>
                    <div className="space-y-2">
                        <p>Total Team Revenue: ${report.metrics.totalTeamRevenue.toFixed(2)}</p>
                        <p>Average Team Tier: {report.metrics.averageTeamTier.toFixed(1)}</p>
                        <p>Direct Referrals: {report.node.directReferrals.length}</p>
                    </div>
                </div>

                {/* Revenue Trends */}
                <div className="bg-white p-4 rounded-lg shadow col-span-2">
                    <h2 className="text-xl font-bold mb-4">Revenue Trends</h2>
                    <div className="h-64">
                        <LineChart width={800} height={200} data={report.metrics.monthlyTrends}>
                            <XAxis dataKey="month" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Line type="monotone" dataKey="revenue" stroke="#8884d8" name="Revenue" />
                            <Line type="monotone" dataKey="earnings" stroke="#82ca9d" name="Earnings" />
                        </LineChart>
                    </div>
                </div>

                {/* Downline List */}
                <div className="bg-white p-4 rounded-lg shadow col-span-2">
                    <h2 className="text-xl font-bold mb-4">Direct Downline</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {report.node.directReferrals.map((referralId: string) => (
                            <button
                                key={referralId}
                                onClick={() => setSelectedNode(referralId)}
                                className="p-2 bg-blue-100 rounded hover:bg-blue-200"
                            >
                                {referralId}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MLMDashboard;