import React, { useState, useEffect } from 'react';
import { 
    LineChart, BarChart, Bar, XAxis, YAxis, CartesianGrid, 
    Tooltip, Legend, Line, ResponsiveContainer, Area, AreaChart
} from 'recharts';
import { Card } from '@/components/ui/card';

// Constants and Types
const SUBSCRIPTION_PRICE = 130;
const MAX_COMMISSION = 82;
const MIN_PROFIT = 48;

interface TierRequirement {
    directReferrals: number;
    teamSize: number;
    commission: number;
}

interface LevelIncentive {
    amount: number;
    requiredDirects: number;
}

interface MLMNode {
    id: string;
    parentId: string | null;
    tier: number;
    directReferrals: string[];
    totalTeamSize: number;
    level: number;
    subscriptions: Subscription[];
    monthlyMetrics: MonthlyMetric[];
}

interface Subscription {
    id: string;
    date: Date;
    amount: number;
    commissions: CommissionBreakdown;
}

interface CommissionBreakdown {
    directCommission: number;
    differenceIncome: number;
    levelIncentives: number;
    total: number;
}

interface MonthlyMetric {
    month: string;
    revenue: number;
    directCommissions: number;
    differenceIncome: number;
    levelIncentives: number;
    totalEarnings: number;
    newRecruits: number;
    activeSubscriptions: number;
}

class MLMConfiguration {
    static readonly TIER_REQUIREMENTS: { [key: number]: TierRequirement } = {
        1: { directReferrals: 0, teamSize: 0, commission: 30 },
        2: { directReferrals: 3, teamSize: 0, commission: 40 },
        3: { directReferrals: 5, teamSize: 20, commission: 50 },
        4: { directReferrals: 8, teamSize: 75, commission: 55 },
        5: { directReferrals: 12, teamSize: 225, commission: 60 },
        6: { directReferrals: 16, teamSize: 700, commission: 65 },
        7: { directReferrals: 20, teamSize: 1500, commission: 70 }
    };

    static readonly LEVEL_INCENTIVES: { [key: number]: LevelIncentive } = {
        2: { amount: 3, requiredDirects: 2 },
        3: { amount: 3, requiredDirects: 3 },
        4: { amount: 2, requiredDirects: 4 },
        5: { amount: 2, requiredDirects: 5 },
        6: { amount: 1, requiredDirects: 6 },
        7: { amount: 1, requiredDirects: 7 }
    };
}

class MLM {
    private nodes: Map<string, MLMNode>;
    private monthsOfHistory: number = 12;
    private currentDate: Date;

    constructor(initialNodes?: number) {
        this.nodes = new Map();
        this.currentDate = new Date();
        if (initialNodes) {
            this.generateRandomNetwork(initialNodes);
        }
    }

    private generateRandomNetwork(totalNodes: number): void {
        // Create root node with T5 characteristics
        const rootNode = this.createNode("root", null, 5);
        this.nodes.set("root", rootNode);

        // Generate T3 leaders
        const t3Count = 2;
        for (let i = 0; i < t3Count; i++) {
            const nodeId = `T3_${i}`;
            const node = this.createNode(nodeId, "root", 3);
            this.nodes.set(nodeId, node);
            rootNode.directReferrals.push(nodeId);
        }

        // Generate T2 promoters
        const t2Count = 5;
        for (let i = 0; i < t2Count; i++) {
            const nodeId = `T2_${i}`;
            const parentId = this.selectRandomParent(["root", ...Array.from(this.nodes.keys())]);
            const node = this.createNode(nodeId, parentId, 2);
            this.nodes.set(nodeId, node);
            this.nodes.get(parentId)!.directReferrals.push(nodeId);
        }

        // Generate remaining nodes (mostly T1)
        const remainingNodes = totalNodes - 1 - t3Count - t2Count;
        for (let i = 0; i < remainingNodes; i++) {
            const nodeId = `node_${i}`;
            const parentId = this.selectRandomParent([...Array.from(this.nodes.keys())]);
            const node = this.createNode(nodeId, parentId, 1);
            this.nodes.set(nodeId, node);
            this.nodes.get(parentId)!.directReferrals.push(nodeId);
        }

        // Generate historical data and update metrics
        this.generateHistoricalData();
        this.updateNetworkMetrics();
    }

    private createNode(id: string, parentId: string | null, initialTier: number): MLMNode {
        return {
            id,
            parentId,
            tier: initialTier,
            directReferrals: [],
            totalTeamSize: 0,
            level: parentId ? this.nodes.get(parentId)!.level + 1 : 0,
            subscriptions: [],
            monthlyMetrics: []
        };
    }

    private selectRandomParent(existingNodes: string[]): string {
        const weights = existingNodes.map(nodeId => {
            const node = this.nodes.get(nodeId)!;
            // Higher tier nodes are more likely to get new referrals
            return Math.pow(2, node.tier);
        });
        
        const totalWeight = weights.reduce((a, b) => a + b, 0);
        let random = Math.random() * totalWeight;
        
        for (let i = 0; i < existingNodes.length; i++) {
            random -= weights[i];
            if (random <= 0) {
                return existingNodes[i];
            }
        }
        return existingNodes[0];
    }

    private generateHistoricalData(): void {
        const startDate = new Date();
        startDate.setMonth(startDate.getMonth() - this.monthsOfHistory);

        // Generate subscriptions for each month
        for (let month = 0; month < this.monthsOfHistory; month++) {
            const currentDate = new Date(startDate);
            currentDate.setMonth(currentDate.getMonth() + month);

            // Generate 20 subscriptions per month
            for (let i = 0; i < 20; i++) {
                const randomNode = this.selectRandomNode();
                this.addSubscription(randomNode, currentDate);
            }
        }
    }

    private selectRandomNode(): string {
        const nodes = Array.from(this.nodes.keys());
        return nodes[Math.floor(Math.random() * nodes.length)];
    }

    private addSubscription(nodeId: string, date: Date): void {
        const node = this.nodes.get(nodeId)!;
        const commissions = this.calculateCommissions(nodeId, date);
        
        const subscription: Subscription = {
            id: `sub_${date.getTime()}_${nodeId}`,
            date,
            amount: SUBSCRIPTION_PRICE,
            commissions
        };

        node.subscriptions.push(subscription);
        this.updateMonthlyMetrics(nodeId, date);
    }

    private calculateCommissions(nodeId: string, date: Date): CommissionBreakdown {
        const node = this.nodes.get(nodeId)!;
        let directCommission = MLMConfiguration.TIER_REQUIREMENTS[node.tier].commission;
        let differenceIncome = 0;
        let levelIncentives = 0;

        // Calculate upline difference income and level incentives
        let currentNode = node;
        let level = 1;
        
        while (currentNode.parentId && level <= 7) {
            const parentNode = this.nodes.get(currentNode.parentId)!;
            
            // Difference income
            if (parentNode.tier > currentNode.tier) {
                const parentCommission = MLMConfiguration.TIER_REQUIREMENTS[parentNode.tier].commission;
                const currentCommission = MLMConfiguration.TIER_REQUIREMENTS[currentNode.tier].commission;
                differenceIncome += parentCommission - currentCommission;
            }

            // Level incentives
            const levelIncentive = MLMConfiguration.LEVEL_INCENTIVES[level];
            if (levelIncentive && parentNode.directReferrals.length >= levelIncentive.requiredDirects) {
                levelIncentives += levelIncentive.amount;
            }

            currentNode = parentNode;
            level++;
        }

        // Cap total commission at MAX_COMMISSION
        const total = Math.min(directCommission + differenceIncome + levelIncentives, MAX_COMMISSION);

        return {
            directCommission,
            differenceIncome,
            levelIncentives,
            total
        };
    }

    private updateMonthlyMetrics(nodeId: string, date: Date): void {
        const node = this.nodes.get(nodeId)!;
        const monthKey = `${date.getFullYear()}-${date.getMonth() + 1}`;
        
        let metric = node.monthlyMetrics.find(m => m.month === monthKey);
        if (!metric) {
            metric = {
                month: monthKey,
                revenue: 0,
                directCommissions: 0,
                differenceIncome: 0,
                levelIncentives: 0,
                totalEarnings: 0,
                newRecruits: 0,
                activeSubscriptions: 0
            };
            node.monthlyMetrics.push(metric);
        }

        // Update metrics based on new subscription
        const monthSubscriptions = node.subscriptions.filter(sub => 
            sub.date.getFullYear() === date.getFullYear() && 
            sub.date.getMonth() === date.getMonth()
        );

        metric.revenue = monthSubscriptions.reduce((sum, sub) => sum + sub.amount, 0);
        metric.directCommissions = monthSubscriptions.reduce((sum, sub) => sum + sub.commissions.directCommission, 0);
        metric.differenceIncome = monthSubscriptions.reduce((sum, sub) => sum + sub.commissions.differenceIncome, 0);
        metric.levelIncentives = monthSubscriptions.reduce((sum, sub) => sum + sub.commissions.levelIncentives, 0);
        metric.totalEarnings = monthSubscriptions.reduce((sum, sub) => sum + sub.commissions.total, 0);
        metric.activeSubscriptions = monthSubscriptions.length;
    }

    private updateNetworkMetrics(): void {
        // Update team sizes
        for (const [nodeId, node] of this.nodes) {
            node.totalTeamSize = this.calculateTeamSize(nodeId);
        }

        // Update tiers based on new team sizes
        for (const [nodeId, node] of this.nodes) {
            node.tier = this.calculateTier(node);
        }
    }

    private calculateTeamSize(nodeId: string): number {
        const node = this.nodes.get(nodeId)!;
        return node.directReferrals.reduce((size, referralId) => {
            return size + 1 + this.calculateTeamSize(referralId);
        }, 0);
    }

    private calculateTier(node: MLMNode): number {
        for (let tier = 7; tier >= 1; tier--) {
            const requirement = MLMConfiguration.TIER_REQUIREMENTS[tier];
            if (node.directReferrals.length >= requirement.directReferrals && 
                node.totalTeamSize >= requirement.teamSize) {
                return tier;
            }
        }
        return 1;
    }

    getNodeReport(nodeId: string): {
        nodeDetails: MLMNode;
        hierarchyMetrics: {
            upline: MLMNode[];
            downline: MLMNode[];
        };
        teamMetrics: {
            totalTeamSize: number;
            averageTeamTier: number;
            teamRevenue: number;
            teamCommissions: number;
        };
        financialMetrics: {
            monthlyTrends: MonthlyMetric[];
            projectedEarnings: number;
            averageCommissionRate: number;
        };
    } {
        const node = this.nodes.get(nodeId)!;
        const upline = this.getUpline(nodeId);
        const downline = this.getDownline(nodeId);
        
        // Calculate team metrics
        const teamMetrics = {
            totalTeamSize: node.totalTeamSize,
            averageTeamTier: downline.reduce((sum, n) => sum + n.tier, 0) / downline.length,
            teamRevenue: this.calculateTeamRevenue(nodeId),
            teamCommissions: this.calculateTeamCommissions(nodeId)
        };

        // Calculate financial metrics
        const financialMetrics = {
            monthlyTrends: node.monthlyMetrics,
            projectedEarnings: this.calculateProjectedEarnings(nodeId),
            averageCommissionRate: this.calculateAverageCommissionRate(nodeId)
        };

        return {
            nodeDetails: node,
            hierarchyMetrics: {
                upline,
                downline
            },
            teamMetrics,
            financialMetrics
        };
    }

    private getUpline(nodeId: string): MLMNode[] {
        const upline: MLMNode[] = [];
        let currentNode = this.nodes.get(nodeId);
        
        while (currentNode?.parentId) {
            const parent = this.nodes.get(currentNode.parentId);
            if (parent) {
                upline.push(parent);
                currentNode = parent;
            } else {
                break;
            }
        }
        
        return upline;
    }

    private getDownline(nodeId: string): MLMNode[] {
        const node = this.nodes.get(nodeId)!;
        return node.directReferrals.reduce((downline: MLMNode[], referralId) => {
            const referral = this.nodes.get(referralId)!;
            return [...downline, referral, ...this.getDownline(referralId)];
        }, []);
    }

    // Additional calculation methods...
   // ... continuing from previous implementation

   private calculateTeamRevenue(nodeId: string): number {
    const node = this.nodes.get(nodeId)!;
    const downline = this.getDownline(nodeId);
    
    return [...downline, node].reduce((total, member) => {
        return total + member.monthlyMetrics.reduce((sum, metric) => 
            sum + metric.revenue, 0);
    }, 0);
}

private calculateTeamCommissions(nodeId: string): number {
    const node = this.nodes.get(nodeId)!;
    const downline = this.getDownline(nodeId);
    
    return [...downline, node].reduce((total, member) => {
        return total + member.monthlyMetrics.reduce((sum, metric) => 
            sum + metric.totalEarnings, 0);
    }, 0);
}

private calculateProjectedEarnings(nodeId: string): number {
    const node = this.nodes.get(nodeId)!;
    const recentMonths = node.monthlyMetrics.slice(-3);
    
    if (recentMonths.length === 0) return 0;
    
    const averageMonthlyEarnings = recentMonths.reduce((sum, metric) => 
        sum + metric.totalEarnings, 0) / recentMonths.length;
        
    // Project next month's earnings with growth factor
    const growthFactor = this.calculateGrowthFactor(node);
    return averageMonthlyEarnings * growthFactor;
}

private calculateGrowthFactor(node: MLMNode): number {
    const recentMonths = node.monthlyMetrics.slice(-3);
    if (recentMonths.length < 2) return 1;

    const growthRates = recentMonths.slice(1).map((metric, index) => 
        metric.totalEarnings / recentMonths[index].totalEarnings);
        
    const averageGrowth = growthRates.reduce((sum, rate) => sum + rate, 0) / growthRates.length;
    return Math.max(1, Math.min(averageGrowth, 1.5)); // Cap growth between 0% and 50%
}

private calculateAverageCommissionRate(nodeId: string): number {
    const node = this.nodes.get(nodeId)!;
    const recentMonths = node.monthlyMetrics.slice(-3);
    
    if (recentMonths.length === 0) return 0;
    
    const totalRevenue = recentMonths.reduce((sum, metric) => sum + metric.revenue, 0);
    const totalEarnings = recentMonths.reduce((sum, metric) => sum + metric.totalEarnings, 0);
    
    return totalRevenue > 0 ? (totalEarnings / totalRevenue) * 100 : 0;
}
}

// React Dashboard Component
const MLMDashboard: React.FC = () => {
const [network, setNetwork] = useState<MLMNetwork | null>(null);
const [selectedNode, setSelectedNode] = useState<string>('root');
const [report, setReport] = useState<any>(null);
const [timeRange, setTimeRange] = useState<'3m' | '6m' | '12m'>('3m');

useEffect(() => {
    // Initialize network with 100 nodes
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

const filterMetricsByTimeRange = (metrics: MonthlyMetric[]) => {
    const months = timeRange === '3m' ? 3 : timeRange === '6m' ? 6 : 12;
    return metrics.slice(-months);
};

return (
    <div className="p-6 space-y-6">
        {/* Header Section */}
        <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold">MLM Network Dashboard</h1>
            <div className="space-x-2">
                <button 
                    onClick={() => setTimeRange('3m')}
                    className={`px-3 py-1 rounded ${timeRange === '3m' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
                >
                    3M
                </button>
                <button 
                    onClick={() => setTimeRange('6m')}
                    className={`px-3 py-1 rounded ${timeRange === '6m' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
                >
                    6M
                </button>
                <button 
                    onClick={() => setTimeRange('12m')}
                    className={`px-3 py-1 rounded ${timeRange === '12m' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
                >
                    12M
                </button>
            </div>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Node Information */}
            <Card className="p-4">
                <h2 className="text-xl font-bold mb-4">Node Information</h2>
                <div className="space-y-2">
                    <div className="flex justify-between">
                        <span>ID:</span>
                        <span>{report.nodeDetails.id}</span>
                    </div>
                    <div className="flex justify-between">
                        <span>Tier:</span>
                        <span>T{report.nodeDetails.tier}</span>
                    </div>
                    <div className="flex justify-between">
                        <span>Direct Referrals:</span>
                        <span>{report.nodeDetails.directReferrals.length}</span>
                    </div>
                    <div className="flex justify-between">
                        <span>Team Size:</span>
                        <span>{report.teamMetrics.totalTeamSize}</span>
                    </div>
                </div>
            </Card>

            {/* Financial Overview */}
            <Card className="p-4">
                <h2 className="text-xl font-bold mb-4">Financial Overview</h2>
                <div className="space-y-2">
                    <div className="flex justify-between">
                        <span>Monthly Revenue:</span>
                        <span>${report.nodeDetails.monthlyMetrics[report.nodeDetails.monthlyMetrics.length - 1]?.revenue.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                        <span>Commission Rate:</span>
                        <span>{report.financialMetrics.averageCommissionRate.toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between">
                        <span>Projected Earnings:</span>
                        <span>${report.financialMetrics.projectedEarnings.toFixed(2)}</span>
                    </div>
                </div>
            </Card>

            {/* Team Performance */}
            <Card className="p-4">
                <h2 className="text-xl font-bold mb-4">Team Performance</h2>
                <div className="space-y-2">
                    <div className="flex justify-between">
                        <span>Average Team Tier:</span>
                        <span>{report.teamMetrics.averageTeamTier.toFixed(1)}</span>
                    </div>
                    <div className="flex justify-between">
                        <span>Team Revenue:</span>
                        <span>${report.teamMetrics.teamRevenue.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                        <span>Team Commissions:</span>
                        <span>${report.teamMetrics.teamCommissions.toFixed(2)}</span>
                    </div>
                </div>
            </Card>

            {/* Revenue Trends Chart */}
            <Card className="col-span-full p-4">
                <h2 className="text-xl font-bold mb-4">Revenue Trends</h2>
                <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={filterMetricsByTimeRange(report.nodeDetails.monthlyMetrics)}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="month" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Area 
                                type="monotone" 
                                dataKey="revenue" 
                                stroke="#8884d8" 
                                fill="#8884d8" 
                                name="Revenue"
                            />
                            <Area 
                                type="monotone" 
                                dataKey="totalEarnings" 
                                stroke="#82ca9d" 
                                fill="#82ca9d" 
                                name="Earnings"
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </Card>

            {/* Commission Breakdown */}
            <Card className="col-span-full md:col-span-2 p-4">
                <h2 className="text-xl font-bold mb-4">Commission Breakdown</h2>
                <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={filterMetricsByTimeRange(report.nodeDetails.monthlyMetrics)}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="month" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="directCommissions" fill="#8884d8" name="Direct" />
                            <Bar dataKey="differenceIncome" fill="#82ca9d" name="Difference" />
                            <Bar dataKey="levelIncentives" fill="#ffc658" name="Level" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </Card>

            {/* Network Navigation */}
            <Card className="col-span-full p-4">
                <h2 className="text-xl font-bold mb-4">Network Navigation</h2>
                <div className="space-y-4">
                    <div>
                        <h3 className="font-semibold mb-2">Upline</h3>
                        <div className="flex flex-wrap gap-2">
                            {report.hierarchyMetrics.upline.map((node: MLMNode) => (
                                <button
                                    key={node.id}
                                    onClick={() => setSelectedNode(node.id)}
                                    className="px-3 py-1 bg-blue-100 rounded hover:bg-blue-200"
                                >
                                    {node.id} (T{node.tier})
                                </button>
                            ))}
                        </div>
                    </div>
                    <div>
                        <h3 className="font-semibold mb-2">Direct Referrals</h3>
                        <div className="flex flex-wrap gap-2">
                            {report.nodeDetails.directReferrals.map((referralId: string) => (
                                <button
                                    key={referralId}
                                    onClick={() => setSelectedNode(referralId)}
                                    className="px-3 py-1 bg-green-100 rounded hover:bg-green-200"
                                >
                                    {referralId}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </Card>
        </div>
    </div>
);
};

export default MLM